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
    console.log('Creating loan with data:', { userId, goalID, loanName, loanAmount });
    
    if (!userId) {
        console.error('Missing required userId for loan');
        throw new Error('userId is required for loan');
    }
    
    if (!goalID) {
        console.error('Missing required goalID for loan');
        throw new Error('goalID is required for loan');
    }
    
    return await Loan.create({
        userId: userId, 
        goalID: goalID, 
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
    // Tìm kiếm với cả user và userId để tương thích với dữ liệu cũ và mới
    const query = { 
        $or: [
            { user: userId },
            { userId: userId }
        ]
    };
    
    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.goal) {
        query.$or[0].goal = filters.goal;
        query.$or[1].goalID = filters.goal;
    }
    if (filters.startDate && filters.endDate) {
        query.startDate = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    console.log('Finding loans with query:', JSON.stringify(query));
    
    const loans = await Loan.find(query)
        .populate('goalID')  // Populate goalID field
        .sort({ startDate: -1 });
        
    console.log(`Found ${loans.length} loans for user ${userId}`);
    return loans;
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

// Get loan by ID
exports.getLoanById = async (loanId) => {
    console.log('Service: Getting loan by ID:', loanId);
    try {
        const loan = await Loan.findById(loanId);
        if (!loan) {
            console.log('Loan not found with ID:', loanId);
            return null;
        }
        
        // Populate goal information if available
        if (loan.goalID) {
            try {
                await loan.populate('goalID');
            } catch (error) {
                console.error('Error populating goal:', error);
                // Không throw error, chỉ log
            }
        }
        
        console.log('Loan found:', loan._id);
        return loan;
    } catch (error) {
        console.error('Error in getLoanById service:', error);
        throw error;
    }
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
        userId: loan.userId,
        message: `Congratulations! You've successfully paid off your loan: ${loan.loanName}`,
        type: 'loan_payment',
        priority: 'high',
        status: 'unread',
        link: `Loan/${loan._id}`
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