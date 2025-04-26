const Goal = require('../models/Goal.model');

exports.createGoal = async ({
    userId,
    goalName,
    targetAmount,
    startDate,
    targetDate,
    type,
    description,
    milestones = [],
    currentAmount = 0,
    status = "active"
}) => {
    console.log('Creating goal with userId:', userId);
    return await Goal.create({
        user: userId,
        userId,
        goalName,
        targetAmount,
        startDate,
        targetDate,
        type,
        description,
        milestones,
        currentAmount,
        status
    });
};

exports.getUserGoals = async (userId, filters = {}) => {
    const query = { user: userId };
    
    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.startDate && filters.endDate) {
        query.targetDate = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    return await Goal.find(query)
        .sort({ targetDate: 1 });
};

exports.updateGoal = async (goalID, {
    goalName,
    targetAmount,
    startDate,
    targetDate,
    type,
    description,
    milestones,
    currentAmount,
    status
}) => {
    const updateData = {};
    if (goalName) updateData.goalName = goalName;
    if (targetAmount) updateData.targetAmount = targetAmount;
    if (startDate) updateData.startDate = startDate;
    if (targetDate) updateData.targetDate = targetDate;
    if (type) updateData.type = type;
    if (description) updateData.description = description;
    if (milestones) updateData.milestones = milestones;
    if (currentAmount !== undefined) updateData.currentAmount = currentAmount;
    if (status) updateData.status = status;

    return await Goal.findByIdAndUpdate(goalID, updateData, { new: true });
};

exports.deleteGoal = async (goalID) => {
    return await Goal.findByIdAndDelete(goalID);
};

// Update goal progress
exports.updateGoalProgress = async (goalId, { currentAmount, milestoneIndex, isAchieved }) => {
  try {
    const goal = await Goal.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }
    
    // Update current amount if provided
    if (currentAmount !== undefined) {
      goal.currentAmount = currentAmount;
    }
    
    // Update milestone if provided
    if (milestoneIndex !== undefined && goal.milestones && goal.milestones[milestoneIndex]) {
      goal.milestones[milestoneIndex].isAchieved = isAchieved || false;
    }
    
    // Check if goal is completed
    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    if (progressPercentage >= 100 && goal.status !== 'completed') {
      goal.status = 'completed';
      
      // Create a congratulatory notification
      const notificationService = require('./notification.service');
      await notificationService.createNotification({
        userId: goal.userId,
        title: 'Financial Goal Achieved!',
        message: `Congratulations! You've reached your goal: ${goal.goalName}`,
        type: 'achievement',
        isRead: false
      });
    } else if (progressPercentage < 100 && goal.status === 'completed') {
      // If the goal was previously marked as completed but is no longer
      goal.status = 'active';
    }
    
    await goal.save();
    return goal;
  } catch (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  }
};

// Check and update milestone achievements
exports.checkMilestones = async (goalId) => {
  try {
    const goal = await Goal.findById(goalId);
    if (!goal || !goal.milestones || goal.milestones.length === 0) {
      return null;
    }
    
    let updated = false;
    const today = new Date();
    
    // Check each milestone
    for (let i = 0; i < goal.milestones.length; i++) {
      const milestone = goal.milestones[i];
      
      // If milestone is due and not achieved, check if the current amount meets the milestone
      if (!milestone.isAchieved && new Date(milestone.date) <= today && goal.currentAmount >= milestone.amount) {
        milestone.isAchieved = true;
        updated = true;
        
        // Create a notification for milestone achievement
        const notificationService = require('./notification.service');
        await notificationService.createNotification({
          userId: goal.userId,
          title: 'Milestone Achieved!',
          message: `You've reached a milestone for your goal: ${goal.goalName}`,
          type: 'milestone',
          isRead: false
        });
      }
    }
    
    if (updated) {
      await goal.save();
    }
    
    return goal;
  } catch (error) {
    console.error('Error checking milestones:', error);
    throw error;
  }
};

// Create a financial goal with automatic milestone generation
exports.createFinancialGoal = async ({
  userId,
  goalName,
  targetAmount,
  startDate,
  targetDate,
  type = 'saving',
  description,
  initialAmount = 0,
  status = 'active'
}) => {
  try {
    // Generate milestones based on the target date
    const start = new Date(startDate);
    const end = new Date(targetDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    // Create at least 3 milestones, but not more than the number of months   
    const milestoneCount = Math.min(Math.max(3, months), 12);
    const milestones = [];

    // Calculate the amount for each milestone
    const amountPerMilestone = targetAmount / milestoneCount;

    // Generate milestone dates and amounts
    for (let i = 0; i < milestoneCount; i++) {
      const milestoneDate = new Date(start);
      milestoneDate.setMonth(start.getMonth() + Math.floor((i + 1) * (months / milestoneCount)));

      milestones.push({
        amount: amountPerMilestone * (i + 1),
        date: milestoneDate,
        isAchieved: false,
        description: `Milestone ${i + 1}: ${((i + 1) * 100 / milestoneCount).toFixed(0)}% of goal`
      });
    }

    console.log('Creating goal with data:', {
      userId,
      goalName,
      targetAmount,
      currentAmount: initialAmount,
      startDate,
      targetDate,
      type,
      description,
      status,
      milestones
    });

    // Create the goal with milestones
    const goal = await exports.createGoal({
      userId,
      goalName,
      targetAmount,
      currentAmount: initialAmount,
      startDate,
      targetDate,
      type,
      description,
      status,
      milestones
    });

    return goal;
  } catch (error) {
    console.error('Error creating financial goal:', error);
    throw error;
  }
};