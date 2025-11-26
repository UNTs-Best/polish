import bcrypt from "bcryptjs";
import UserService from "../services/user.service.js";
import SessionService from "../services/session.service.js";

const userService = new UserService();
const sessionService = new SessionService();

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const existing = await userService.getUserbyEmail(email);
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userService.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      provider: 'local',
      emailVerified: false
    });

    // Don't return password in response
    const userResponse = user.toPublicProfile();

    return res.status(201).json({
      message: "User registered successfully",
      user: userResponse
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await userService.getUserbyEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    // For OAuth users, password login is not allowed
    if (user.isOAuthUser()) {
      return res.status(401).json({
        message: `Please login with ${user.provider}`,
        provider: user.provider
      });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create session and tokens
    const sessionInfo = await sessionService.loginUser(
      user,
      req.get('User-Agent'),
      req.ip
    );

    return res.json({
      message: "Login successful",
      user: sessionInfo.user,
      accessToken: sessionInfo.accessToken,
      refreshToken: sessionInfo.refreshToken,
      expiresIn: sessionInfo.expiresIn
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: "Login failed" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const tokenData = await sessionService.refreshAccessToken(refreshToken);

    return res.json({
      message: "Token refreshed successfully",
      accessToken: tokenData.accessToken,
      expiresIn: tokenData.expiresIn
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    return res.status(401).json({ message: err.message || "Token refresh failed" });
  }
};

export const logout = async (req, res) => {
  try {
    const { allDevices = false } = req.body;
    const userId = req.auth?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get session ID from request (if available)
    const sessionId = req.sessionId;

    await sessionService.logoutUser(userId, allDevices ? null : sessionId);

    return res.json({
      message: allDevices ? "Logged out from all devices" : "Logged out successfully"
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: "Logout failed" });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.auth?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await userService.getUserbyID(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: user.toPublicProfile()
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.auth?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { firstName, lastName, avatar } = req.body;
    const updates = {};

    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (avatar !== undefined) updates.avatar = avatar;

    const updatedUser = await userService.updateUser(userId, updates);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser.toPublicProfile()
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.auth?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }

    const user = await userService.getUserbyID(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // For OAuth users, password change is not allowed
    if (user.isOAuthUser()) {
      return res.status(400).json({
        message: "Password change not allowed for OAuth users"
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user
    const updatedUser = await userService.updateUser(userId, {
      password: hashedPassword
    });

    // Logout from all other sessions for security
    await sessionService.deactivateAllUserSessions(userId);

    return res.json({
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error('Password change error:', err);
    return res.status(500).json({ message: "Failed to change password" });
  }
};
