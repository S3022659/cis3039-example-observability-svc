import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { upsertProduct } from '../app/upsert-product';
import { makeUpsertProductDeps } from '../config/appServices';

const upsertProductHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  try {
    const body = (await request.json()) as any;

    // Validate required fields
    if (!body || typeof body !== 'object') {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: 'Request body is required',
        },
      };
    }

    const { id, name, pricePence, description } = body;

    if (!id || !name || pricePence === undefined || !description) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: 'Missing required fields: id, name, pricePence, description',
        },
      };
    }

    const deps = makeUpsertProductDeps(context);
    const result = await upsertProduct(deps, {
      id,
      name,
      pricePence,
      description,
    });

    if (!result.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: 'Failed to upsert product',
          error: result.error,
        },
      };
    }

    return {
      status: 200,
      jsonBody: {
        ...result.data,
        updatedAt: result.data?.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return {
      status: 500,
      jsonBody: {
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      },
    };
  }
};

app.http('upsertProductHttp', {
  methods: ['PUT', 'POST'],
  authLevel: 'anonymous',
  route: 'products',
  handler: upsertProductHandler,
});
