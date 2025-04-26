const Loan = require("../models/Loan.model");

exports.createLoan = async ({
    userId,
    goalID,
    loanName,
    loanAmount,
    interestRate,
    startDate,
    endDate,
    monthlyPayment,
    paymentSchedule = [],
    remainingBalance,
    status = "active"
}) => {
    return await Loan.create({
        user: userId,
        goal: goalID,
        loanName,
        loanAmount,
        interestRate,
        startDate,
        endDate,
        monthlyPayment,
        paymentSchedule,
        remainingBalance,
        status
    });
};

exports.getUserLoans = async (userId, filters = {}) => {
    const query = { user: userId };
    
    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.goal) query.goal = filters.goal;
    if (filters.startDate && filters.endDate) {
        query.startDate = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    return await Loan.find(query)
        .populate('goal')
        .sort({ startDate: -1 });
};

exports.updateLoan = async (loanID, {
    loanName,
    loanAmount,
    interestRate,
    startDate,
    endDate,
    monthlyPayment,
    paymentSchedule,
    remainingBalance,
    status
}) => {
    const updateData = {};
    if (loanName) updateData.loanName = loanName;
    if (loanAmount) updateData.loanAmount = loanAmount;
    if (interestRate) updateData.interestRate = interestRate;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (monthlyPayment) updateData.monthlyPayment = monthlyPayment;
    if (paymentSchedule) updateData.paymentSchedule = paymentSchedule;
    if (remainingBalance !== undefined) updateData.remainingBalance = remainingBalance;
    if (status) updateData.status = status;

    return await Loan.findByIdAndUpdate(loanID, updateData, { new: true }).populate('goal');
};

exports.deleteLoan = async (loanID) => {
    return await Loan.findByIdAndDelete(loanID);
};

// Generate a payment schedule for a loan
exports.generatePaymentSchedule = async (loanAmount, interestRate, startDate, endDate, monthlyPayment) => {
  try {
    const schedule = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate number of payments
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    // If monthly payment is not provided, calculate it
    let payment = monthlyPayment;
    if (!payment) {
      // Simple calculation for equal payments
      const monthlyInterest = interestRate / 100 / 12;
      payment = (loanAmount * monthlyInterest) / (1 - Math.pow(1 + monthlyInterest, -months));
    }
    
    let remainingBalance = loanAmount;
    let currentDate = new Date(start);
    
    // Generate schedule for each month
    for (let i = 0; i < months; i++) {
      currentDate = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + 1);
      
      const monthlyInterest = (remainingBalance * interestRate) / 100 / 12;
      const principalPayment = payment - monthlyInterest;
      
      remainingBalance -= principalPayment;
      
      // Ensure the last payment covers any rounding issues
      if (i === months - 1) {
        remainingBalance = 0;
      }
      
      schedule.push({
        dueDate: new Date(currentDate),
        amount: payment,
        principalPayment,
        interestPayment: monthlyInterest,
        remainingBalance: Math.max(0, remainingBalance),
        isPaid: false
      });
    }
    
    return {
      schedule,
      monthlyPayment: payment,
      totalPayments: payment * months,
      totalInterest: (payment * months) - loanAmount
    };
  } catch (error) {
    console.error('Error generating payment schedule:', error);
    throw error;
  }
};

// Create a loan and link it to a goal
exports.createLoanWithGoal = async ({
  userId,
  loanName,
  loanAmount,
  interestRate,
  startDate,
  endDate,
  monthlyPayment,
  description
}) => {
  try {
    // Generate payment schedule
    const { schedule, monthlyPayment: calculatedPayment } = await exports.generatePaymentSchedule(
      loanAmount,
      interestRate,
      startDate,
      endDate,
      monthlyPayment
    );
    
    // Create a goal for loan repayment
    const goalService = require('./goal.service');
    const goal = await goalService.createGoal({
      userId,
      goalName: `Repay: ${loanName}`,
      targetAmount: loanAmount,
      startDate,
      targetDate: endDate,
      type: 'debt',
      description: description || `Goal to repay the loan: ${loanName}`,
      milestones: schedule.map((payment, index) => ({
        amount: payment.amount,
        date: payment.dueDate,
        isAchieved: false,
        description: `Payment ${index + 1}`
      }))
    });
    
    // Create the loan linked to the goal
    const loan = await exports.createLoan({
      userId,
      goalID: goal._id,
      loanName,
      loanAmount,
      remainingBalance: loanAmount,
      interestRate,
      startDate,
      endDate,
      monthlyPayment: calculatedPayment || monthlyPayment,
      paymentSchedule: schedule
    });
    
    return { loan, goal };
  } catch (error) {
    console.error('Error creating loan with goal:', error);
    throw error;
  }
};

// Record a loan payment and update the associated goal
exports.recordLoanPayment = async (loanId, paymentIndex, paymentAmount, paymentDate = new Date()) => {
  try {
    // Get the loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }
    
    // Validate payment index
    if (paymentIndex < 0 || paymentIndex >= loan.paymentSchedule.length) {
      throw new Error('Invalid payment index');
    }
    
    // Update the payment in the schedule
    const payment = loan.paymentSchedule[paymentIndex];
    payment.isPaid = true;
    payment.paidDate = paymentDate;
    payment.paidAmount = paymentAmount;
    
    // Calculate new remaining balance
    loan.remainingBalance -= payment.principalPayment || (paymentAmount - (payment.interestPayment || 0));
    
    // Check if loan is completed
    if (loan.remainingBalance <= 0) {
      loan.status = 'completed';
      loan.remainingBalance = 0;
      
      // Create a congratulatory notification
      const notificationService = require('./notification.service');
      await notificationService.createNotification({
        userId: loan.user,
        title: 'Loan Repayment Complete!',
        message: `Congratulations! You've successfully paid off your loan: ${loan.loanName}`,
        type: 'achievement',
        isRead: false
      });
    }
    
    // Save the loan
    await loan.save();
    
    // Update the associated goal
    if (loan.goalID) {
      const goalService = require('./goal.service');
      const updatedGoal = await goalService.updateGoalProgress(loan.goalID, {
        currentAmount: loan.loanAmount - loan.remainingBalance,
        milestoneIndex: paymentIndex,
        isAchieved: true
      });
      
      return { loan, goal: updatedGoal };
    }
    
    return { loan };
  } catch (error) {
    console.error('Error recording loan payment:', error);
    throw error;
  }
};