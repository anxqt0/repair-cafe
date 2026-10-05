import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { getSqlPool } from './db.js';

const pool = await getSqlPool();
const projectRoot = new URL('../', import.meta.url);

try {
  await pool.request().batch(await readFile(new URL('db/schema.sql', projectRoot), 'utf8'));
  await pool.request().batch(await readFile(new URL('db/seed-data.sql', projectRoot), 'utf8'));

  const identityName = process.env.AZURE_API_IDENTITY_NAME;
  const identityObjectId = process.env.AZURE_API_IDENTITY_OBJECT_ID;
  if (identityName || identityObjectId) {
    if (!identityName || !/^[A-Za-z0-9._-]{1,128}$/.test(identityName) ||
        !identityObjectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identityObjectId)) {
      throw new Error('Set a valid AZURE_API_IDENTITY_NAME and AZURE_API_IDENTITY_OBJECT_ID pair');
    }
    await pool.request().batch(`
      IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'${identityName}')
        CREATE USER [${identityName}] FROM EXTERNAL PROVIDER WITH OBJECT_ID = '${identityObjectId}';
      IF NOT EXISTS (
        SELECT 1 FROM sys.database_role_members rm
        JOIN sys.database_principals role_p ON role_p.principal_id = rm.role_principal_id
        JOIN sys.database_principals member_p ON member_p.principal_id = rm.member_principal_id
        WHERE role_p.name = N'db_datareader' AND member_p.name = N'${identityName}'
      ) ALTER ROLE db_datareader ADD MEMBER [${identityName}];
      IF NOT EXISTS (
        SELECT 1 FROM sys.database_role_members rm
        JOIN sys.database_principals role_p ON role_p.principal_id = rm.role_principal_id
        JOIN sys.database_principals member_p ON member_p.principal_id = rm.member_principal_id
        WHERE role_p.name = N'db_datawriter' AND member_p.name = N'${identityName}'
      ) ALTER ROLE db_datawriter ADD MEMBER [${identityName}];
    `);
  }
  console.log('Repair Café database is ready.');
} finally {
  await pool.close();
}
