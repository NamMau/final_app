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
    console.log('Getting goals for userId:', userId);
    
    // Tìm kiếm goals bằng cả user và userId để đảm bảo tương thích với cả dữ liệu cũ và mới
    const query = { 
        $or: [
            { user: userId },
            { userId: userId }
        ]
    };
    
    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.startDate && filters.endDate) {
        query.targetDate = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    console.log('Query for goals:', JSON.stringify(query));
    const goals = await Goal.find(query).sort({ targetDate: 1 });
    console.log('Found goals:', goals.length);
    return goals;
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

// Get goal by ID
exports.getGoalById = async (goalId) => {
    try {
        console.log('Getting goal by ID:', goalId);
        const goal = await Goal.findById(goalId);
        if (!goal) {
            console.log('Goal not found with ID:', goalId);
            return null;
        }
        console.log('Found goal:', goal.goalName);
        return goal;
    } catch (error) {
        console.error('Error getting goal by ID:', error);
        throw error;
    }
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
    
    // Lấy ngày hiện tại và ngày mục tiêu
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    
    // Check if goal is completed
    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    
    // Kiểm tra xem goal đã hoàn thành hay thất bại
    const notificationService = require('./notification.service');
    
    // Đảm bảo có userId hợp lệ
    const userId = goal.userId || goal.user;
    if (!userId) {
      console.warn('No valid userId found for goal:', goalId);
      throw new Error('No valid userId found for goal');
    }
    
    // Nếu đạt 100% tiến độ và chưa được đánh dấu là hoàn thành
    if (progressPercentage >= 100 && goal.status !== 'completed') {
      goal.status = 'completed';
      
      // Tạo thông báo chúc mừng với type hợp lệ
      await notificationService.createNotification({
        userId: userId,
        message: `Congratulations! You've reached your goal: ${goal.goalName}`,
        type: 'goal_achieved', // Sử dụng giá trị enum hợp lệ
        priority: 'high',
        status: 'unread',
        link: `/goals/${goal._id}`
      });
    } 
    // Nếu đã quá hạn mà chưa hoàn thành và chưa được đánh dấu là thất bại
    else if (targetDate < today && progressPercentage < 100 && goal.status !== 'failed') {
      goal.status = 'failed';
      
      // Tạo thông báo thất bại
      await notificationService.createNotification({
        userId: userId,
        message: `Your goal "${goal.goalName}" has passed its deadline without completion.`,
        type: 'system', // Sử dụng giá trị enum hợp lệ
        priority: 'medium',
        status: 'unread',
        link: `/goals/${goal._id}`
      });
    }
    // Nếu tiến độ < 100% và trước đây đã đánh dấu là hoàn thành
    else if (progressPercentage < 100 && goal.status === 'completed') {
      // Nếu goal đã được đánh dấu là hoàn thành nhưng không còn nữa
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
    const notificationService = require('./notification.service');
    
    // Đảm bảo có userId hợp lệ
    const userId = goal.userId || goal.user;
    if (!userId) {
      console.warn('No valid userId found for goal:', goalId);
      return null;
    }
    
    // Check each milestone
    for (let i = 0; i < goal.milestones.length; i++) {
      const milestone = goal.milestones[i];
      
      // If milestone is due and not achieved, check if the current amount meets the milestone
      if (!milestone.isAchieved && new Date(milestone.date) <= today && goal.currentAmount >= milestone.amount) {
        milestone.isAchieved = true;
        updated = true;
        
        // Tạo thông báo đạt milestone với type hợp lệ
        await notificationService.createNotification({
          userId: userId,
          message: `You've reached a milestone for your goal "${goal.goalName}": ${milestone.description || `Milestone ${i + 1}`}`,
          type: 'goal_achieved', // Sử dụng giá trị enum hợp lệ
          priority: 'medium',
          status: 'unread',
          link: `/goals/${goal._id}`
        });
      }
      
      // Nếu milestone đã quá hạn mà chưa đạt được, tạo thông báo nhắc nhở
      else if (!milestone.isAchieved && new Date(milestone.date) < today && goal.currentAmount < milestone.amount) {
        // Chỉ tạo thông báo nếu milestone chưa quá hạn quá 7 ngày
        const daysPassed = Math.floor((today - new Date(milestone.date)) / (1000 * 60 * 60 * 24));
        if (daysPassed <= 7) {
          await notificationService.createNotification({
            userId: userId,
            message: `A milestone for your goal "${goal.goalName}" has passed its due date. Keep pushing!`,
            type: 'system', // Sử dụng giá trị enum hợp lệ
            priority: 'low',
            status: 'unread',
            link: `/goals/${goal._id}`
          });
        }
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