import bcrypt from "bcryptjs"

import { db } from "./db.server"
import { createCookieSessionStorage, redirect } from "@remix-run/node"

type LoginForm = {
  password: string
  username: string
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({ where: { username } })
  if (!user) {
    return null
  }
  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash)
  if (!isCorrectPassword) {
    return null
  }

  return { id: user.id, username }
}

const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error("SESSION_SECRET not set")
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "RJ_Session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"))
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request)
  const userId = session.get("userId")
  if (!userId || typeof userId !== "string") {
    return null
  }
  return userId
}
export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  let userId = await getUserId(request)
  if (!userId) {
    let params = new URLSearchParams([["redirectTo", redirectTo]])
    throw redirect(decodeURIComponent(`/login?${params}`))
  }
  return userId
}

export async function getUser(request: Request) {
  let userId = await getUserId(request)
  if (!userId) return null
  return db.user.findUnique({ where: { id: userId } })
}

export async function logout(request: Request) {
  const session = await getUserSession(request)
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  })
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession()
  session.set("userId", userId)
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  })
}
