import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./ApiError";
import { ApiResponse } from "./ApiResponse";

type AsyncRequestHandler = (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>;

const asyncHandler =
  (requestHandler: AsyncRequestHandler) =>
  async (req: NextRequest, ...args: unknown[]) => {
    try {
      return await requestHandler(req, ...args);
    } catch (error) {
      console.error(error);

      const apiError =
        error instanceof ApiError ? error : new ApiError(500, "An internal server error occurred.");

      return ApiResponse.json(apiError.statusCode, { errors: apiError.errors }, apiError.message);
    }
  };

export { asyncHandler };
