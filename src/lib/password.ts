import bcrypt from "bcryptjs";

// Node-only (bcryptjs). Keep out of Edge middleware — import from route handlers only.
export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
