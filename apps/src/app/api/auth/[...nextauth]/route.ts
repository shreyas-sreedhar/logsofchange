// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "../../../auth";

// Export handlers for GET and POST
export const GET = handlers.GET;
export const POST = handlers.POST;