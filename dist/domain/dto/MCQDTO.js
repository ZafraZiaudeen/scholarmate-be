"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMCQDTO = void 0;
const zod_1 = require("zod");
exports.CreateMCQDTO = zod_1.z.object({
    year: zod_1.z.string(),
    questionNumber: zod_1.z.string(),
    question: zod_1.z.string(),
    options: zod_1.z.array(zod_1.z.string()),
    correctAnswer: zod_1.z.string(),
    chapter: zod_1.z.string().optional(),
});
//# sourceMappingURL=MCQDTO.js.map