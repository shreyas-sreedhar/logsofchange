export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Get the changelog ID from params
    const changelogId = context.params.id;
    
    // ... existing code ...
  } catch (error) {
    // Handle any errors that occur during the process
    console.error('Error fetching changelog:', error);
    return new Response('Error fetching changelog', { status: 500 });
  }
} 