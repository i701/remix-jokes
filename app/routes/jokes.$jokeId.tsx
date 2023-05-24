import { LoaderFunction, json } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import { db } from "~/utils/db.server"
import { Toaster } from "react-hot-toast"

export const loader: LoaderFunction = async ({ params }) => {
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  })
  if (!joke) {
    throw new Error("No joke found.")
  }

  return json({ joke })
}

export default function JokeRoute() {
  const data = useLoaderData<typeof loader>()
  return (
    <div>
      <Toaster />
      <p>Here's your hilarious joke:</p>
      <p>{data.joke.content}</p>
      <Link to=".">"{data.joke.name}" Permalink</Link>
    </div>
  )
}
