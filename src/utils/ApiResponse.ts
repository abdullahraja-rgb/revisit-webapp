"use server";

import { NextResponse } from "next/server";

class ApiResponse {
  constructor(
    public statusCode: number,
    public data: object = {},
    public message: string = "Success"
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }

  public static json(statusCode: number, data: object, message: string = "Success") {
    return NextResponse.json(
      {
        message,
        data,
        success: statusCode < 400,
      },
      { status: statusCode }
    );
  }
}

export { ApiResponse };
