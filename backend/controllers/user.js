// controllers/user.controller.js
import User from '../models/userAuth.js';
import argon2 from 'argon2';

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sort = 'createdAt', 
            order = 'desc',
            search = '',
            role = '',
            isActive = '' 
        } = req.query;

        // Build query
        const query = {};
        
        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by role
        if (role) {
            query.role = role;
        }

        // Filter by active status
        if (isActive !== '') {
            query.isActive = isActive === 'true';
        }

        // Count total documents
        const total = await User.countDocuments(query);

        // Execute query with pagination and sorting
        const users = await User.find(query)
            .select('-password')
            .sort({ [sort]: order === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                count: users.length,
                totalRecords: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin

export const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, role, isActive, firstName, lastName, image } = req.body;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is being changed and if it's already in use
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email, _id: { $ne: userId } });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already in use'
                });
            }
        }

        // Prepare update data
        let updateData = {
            name: name || user.name,
            email: email || user.email,
            role: role || user.role,
            isActive: isActive !== undefined ? isActive : user.isActive,
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            image: image || user.image
        };

        // Handle profile image if uploaded
        if (req.file) {
            updateData.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                isActive: updatedUser.isActive,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                image: updatedUser.image,
                updatedAt: updatedUser.updatedAt
            }
        });

    } catch (error) {
        console.error('User update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during user update',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting the last admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the last admin user'
                });
            }
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        // Validate role
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent removing the last admin
        if (user.role === 'admin' && role === 'user') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot remove the last admin'
                });
            }
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
};

// @desc    Get user stats (counts by role, active status, etc.)
// @route   GET /api/users/stats
// @access  Private/Admin
export const getUserStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: { 
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    admins: { 
                        $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
                    },
                    regularUsers: { 
                        $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalUsers: 1,
                    activeUsers: 1,
                    inactiveUsers: { 
                        $subtract: ['$totalUsers', '$activeUsers'] 
                    },
                    admins: 1,
                    regularUsers: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats[0] || {
                totalUsers: 0,
                activeUsers: 0,
                inactiveUsers: 0,
                admins: 0,
                regularUsers: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};

export const updateUserPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash the new password with Argon2 before saving
        const hashedPassword = await argon2.hash(newPassword, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
            hashLength: 32
        });
        
        // Update the password directly instead of using the model middleware
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating password',
            error: error.message
        });
    }
};

export const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deactivating the last active admin
        if (user.role === 'admin' && user.isActive) {
            const activeAdmins = await User.countDocuments({
                role: 'admin',
                isActive: true
            });

            if (activeAdmins <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot deactivate the last active admin'
                });
            }
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling user status',
            error: error.message
        });
    }
};