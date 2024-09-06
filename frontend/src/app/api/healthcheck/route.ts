import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json(
      {
        message: 'Hello from the NextJS API',
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
