"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBookDTO = void 0;
const zod_1 = require("zod");
exports.CreateBookDTO = zod_1.z.object({
    title: zod_1.z.string(),
    pageNumber: zod_1.z.string(),
    content: zod_1.z.string(),
    chapter: zod_1.z.string().optional(),
});
//# sourceMappingURL=BookDTO.js.map