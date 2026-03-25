import UserService from "../services/user.service.js";

const userService = new UserService();

export async function me(req, res) {
  try {
    const userId = req.auth?.id;
    if (!userId) return res.status(401).json({ message: "Missing auth" });
    const user = await userService.getUserbyID(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: user.toPublicProfile ? user.toPublicProfile() : user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function list(req, res) {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(503).json({ message: "Database unavailable" });
  }
}
