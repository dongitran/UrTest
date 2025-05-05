import { zValidator } from '@hono/zod-validator';
import dayjs from 'dayjs';
import db from 'db/db';
import { CommentTable } from 'db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { ulid } from 'ulid';
import { z } from 'zod';
import * as CommentSchema from 'lib/Zod/CommentSchema';
import CheckPermission, { ROLES } from '@middlewars/CheckPermission';
import CheckProjectAccess from '@middlewars/CheckProjectAccess';

const CommentRoute = new Hono();

CommentRoute.post(
  '/',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('json', CommentSchema.schemaForCreateComment),
  async (ctx) => {
    const user = ctx.get('user');
    const body = ctx.req.valid('json');

    if (body.testSuiteId && body.resourceId) {
      return ctx.json(
        {
          message: 'Cannot specify both testSuiteId and resourceId',
        },
        400
      );
    }

    const comment = await db
      .insert(CommentTable)
      .values({
        id: ulid(),
        projectId: body.projectId,
        testSuiteId: body.testSuiteId,
        resourceId: body.resourceId,
        email: user.email,
        message: body.message,
        createdAt: dayjs().toISOString(),
        createdBy: user.email,
      })
      .returning()
      .then((res) => res[0]);

    return ctx.json({ comment });
  }
);

CommentRoute.get(
  '/',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  CheckProjectAccess(),
  zValidator('query', CommentSchema.schemaForGetComments),
  async (ctx) => {
    const query = ctx.req.valid('query');

    let conditions: any[] = [isNull(CommentTable.deletedAt)];

    if (query.projectId) {
      conditions.push(eq(CommentTable.projectId, query.projectId));
    }
    if (query.testSuiteId) {
      conditions.push(eq(CommentTable.testSuiteId, query.testSuiteId));
    }
    if (query.resourceId) {
      conditions.push(eq(CommentTable.resourceId, query.resourceId));
    }

    const comments = await db.query.CommentTable.findMany({
      where: and(...conditions),
      orderBy: (clm, { desc }) => desc(clm.createdAt),
    });

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      email: comment.email,
      message: comment.message,
      createdAt: comment.createdAt,
    }));

    return ctx.json({ comments: formattedComments });
  }
);

CommentRoute.delete(
  '/:id',
  CheckPermission([ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
  zValidator('param', z.object({ id: z.string().ulid() })),
  async (ctx) => {
    const { id } = ctx.req.valid('param');
    const user = ctx.get('user');

    const comment = await db.query.CommentTable.findFirst({
      where: (clm, { eq, and, isNull }) => and(eq(clm.id, id), isNull(clm.deletedAt)),
    });

    if (!comment) {
      return ctx.json({ message: 'Comment not found' }, 404);
    }

    const isStaff =
      user.roles.includes(ROLES.STAFF) &&
      !user.roles.includes(ROLES.ADMIN) &&
      !user.roles.includes(ROLES.MANAGER);
    const isCreator = comment.createdBy === user.email;

    if (isStaff && !isCreator) {
      return ctx.json({ message: 'Forbidden: You can only delete your own comments' }, 403);
    }

    await db
      .update(CommentTable)
      .set({
        deletedAt: dayjs().toISOString(),
        deletedBy: user.email,
      })
      .where(eq(CommentTable.id, id));

    return ctx.json({ message: 'Comment deleted successfully' });
  }
);

export default CommentRoute;
