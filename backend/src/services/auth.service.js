
/*
 * Contains the business logic for user registration and login.
 * Handles password hashing, credential verification and JWT generation.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../config/prisma.js";
import AppError from "../utils/app-error.js";

const SALT_ROUNDS = 12;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  return secret;
};

const createToken = (user) => {
  return jwt.sign(
    {
      role: user.role,
    },
    getJwtSecret(),
    {
      subject: user.id,
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

export const registerUser = async ({ name, email, password, role }) => {
  const normalizedEmail = email.toLowerCase();

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let user;

  try {
    user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role,
      },
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new AppError("An account with this email already exists.", 409);
    }

    throw error;
  }

  return {
    user: sanitizeUser(user),
    token: createToken(user),
  };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  return {
    user: sanitizeUser(user),
    token: createToken(user),
  };
};

export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User account not found.", 404);
  }

  return sanitizeUser(user);
};
