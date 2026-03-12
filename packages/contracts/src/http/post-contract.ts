//   getPost: oc
//     .route({
//       method: "GET",
//     })
//     .input(postSchema.shape._id)
//     .output(postSchema)
//     .errors({
//       NOT_FOUND: {
//         data: z.object({
//           message: z.string(),
//         }),
//       },
//       INTERNAL_SERVER_ERROR: {
//         data: z.object({
//           message: z.string(),
//         }),
//       },
//     }),
//
//   getPosts: oc
//     .route({
//       method: "GET",
//     })
//     .input(postSchema.shape.authorId)
//     .output(z.array(postSchema))
//     .errors({
//       NOT_FOUND: {
//         data: z.object({
//           message: z.string(),
//         }),
//       },
//       INTERNAL_SERVER_ERROR: {
//         data: z.object({
//           message: z.string(),
//         }),
//       },
//     }),
//

//   createNewComment: oc
//     .route({
//       method: "POST",
//     })
//     .input(
//       z.object({
//         postId: postSchema.shape._id,
//         comment: singleCommentSchema,
//       })
//     )
//     .output(z.object({ success: z.boolean() }))
//     .errors({
//       NOT_FOUND: {
//         data: z.object({
//           message: z.string(),
//         }),
//       },
//       INTERNAL_SERVER_ERROR: {
//         data: z.object({
//           message: z.string(),
//         }),
//       },
//     }),
//
//   replyToComment: oc
//     .route({
//       method: "PUT",
//     })
//     .input(
//       z.object({
//         postId: postSchema.shape._id,
//         commentIndex: z.coerce.number().min(0),
//         reply: z.string().min(1, "Reply must be at least 1 character."),
//       })
//     )
//     .output(z.object({ success: z.boolean() }))
//     .errors({
//       NOT_FOUND: {
//         data: z.object({
//           message: z.string(),
//         }),
//       },
//       INTERNAL_SERVER_ERROR: {
//         data: z.object({
//           message: z.string(),
//         }),
//       },
//     }),
//
//   deleteComment: oc
//     .route({
//       method: "DELETE",
//     })
//     .input(
//       z.object({
//         postId: postSchema.shape._id,
//         commentIndex: z.coerce.number().int().min(0),
//       })
//     )
//     .output(z.object({ success: z.boolean() }))
//     .errors({
//       NOT_FOUND: {
//         data: z.object({
//           message: z.string(),
//         }),
//       },
//       INTERNAL_SERVER_ERROR: {
//         data: z.object({
//           message: z.string(),
//         }),
//       },
//     }),
// };
