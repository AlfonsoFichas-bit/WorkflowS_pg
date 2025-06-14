// A generic placeholder for the result of database execution operations
// like delete or update, if the driver returns specific info.
// For PostgreSQL using node-postgres via Drizzle, the result of `execute()`
// on a delete operation is typically a `QueryResult` from the `pg` package.
// This type would include `rowCount`, `command`, `oid`, `fields`, `rows` etc.
// For simplicity here, we'll define a minimal one.
// In a real project, you'd align this with what your DB driver actually returns
// or use a type directly from Drizzle ORM if it provides a generic one.

export interface DBExecuteResult {
  rowCount: number; // Common property indicating affected rows
  // Potentially other properties like:
  // command?: string;
  // success?: boolean;
}

// You might also want to define other common DB operation related types here.
