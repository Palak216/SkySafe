const { z } = require("zod");

const registerSchema = {
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    // Explicitly do not allow or strip role
  }).strip(),
};

const loginSchema = {
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
};
