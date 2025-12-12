export const elevateError = (err: any): never => {
    // Handle MongoDB client closed errors gracefully (happens during hot reload)
    if (err?.name === 'MongoClientClosedError' || 
        err?.message?.includes('client was closed') ||
        err?.message?.includes('Operation interrupted because client was closed')) {
        // Don't log these errors - they're expected during hot reload
        // Return a user-friendly error instead
        const friendlyError = new Error('Database connection was interrupted. Please try again.');
        friendlyError.name = 'DatabaseError';
        throw friendlyError;
    }
    
    // Log other errors
    console.error('[elevateError] Error:', err);
    throw err;
};
