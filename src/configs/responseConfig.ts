/**
    @description: This file contains all the response configurations
    @author: [sant]
*/

export const successRes = ({
    statusCode,
    message,
    data
  }: {
    statusCode: number;
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
  }) => {
    return {
      code: statusCode,
      error: false,
      message,
      data
    };
  };
  
  export const errorRes = ({
    statusCode,
    message,
    data
  }: {
    statusCode: number;
    message?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
  }) => {
    if (!message && statusCode === 500) message = 'Internal Server Error';
    if (!message && statusCode === 404) message = 'Not Found';
    if (!message && statusCode === 400) message = 'Bad Request';
    if (!message && statusCode === 401) message = 'Unauthorized';
  
    return {
      code: statusCode,
      error: true,
      message,
      data
    };
  };
  