import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { NextRequest } from "next/server";

// Add Model,Images and Video in DB
const postHandler = asyncHandler(async (req: NextRequest) => {
  // const { model, messages } = await req.json();

  console.log(req);
  return ApiResponse.json(200, {}, "Hello, world!");
});

export { postHandler as POST };
