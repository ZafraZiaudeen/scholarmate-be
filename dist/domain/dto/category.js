"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLaundryCategoryDTO = void 0;
const zod_1 = require("zod");
// DTO => Data Transfer Object
exports.CreateLaundryCategoryDTO = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    processingTime: zod_1.z.string(),
    available: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=category.js.map