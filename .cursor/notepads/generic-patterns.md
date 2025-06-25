# 🔧 Generic Patterns

## Async/Await Pattern
```javascript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
```

## Error Handling
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

function handleError(error) {
  if (error.isOperational) {
    // Log and handle operational errors
    console.error('Operational error:', error.message);
  } else {
    // Log and exit for programming errors
    console.error('Programming error:', error);
    process.exit(1);
  }
}
```
