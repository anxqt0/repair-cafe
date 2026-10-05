import sql from 'mssql';

let poolPromise = null;

export function getSqlPool() {
  const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
  const config = connectionString
    ? connectionStringConfig(connectionString)
    : passwordlessConfig();

  if (!config) {
    const err = new Error('Azure SQL connection settings are missing');
    err.code = 'NO_DB_CONFIG';
    throw err;
  }

  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then(pool => {
        pool.on('close', () => { poolPromise = null; });
        return pool;
      })
      .catch(err => {
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

function connectionStringConfig(connectionString) {
  const hasServer = /(?:^|;)\s*(?:Server|Data Source)\s*=\s*[^;]+/i.test(connectionString);
  const hasDatabase = /(?:^|;)\s*(?:Initial Catalog|Database)\s*=\s*[^;]+/i.test(connectionString);
  if (!hasServer || !hasDatabase) {
    const err = new Error('AZURE_SQL_CONNECTION_STRING must include Server and Initial Catalog values');
    err.code = 'INVALID_DB_CONFIG';
    throw err;
  }
  return connectionString;
}

function passwordlessConfig() {
  const server = process.env.AZURE_SQL_SERVER;
  const database = process.env.AZURE_SQL_DATABASE;
  if (!server || !database) return null;

  return {
    server,
    port: Number(process.env.AZURE_SQL_PORT || 1433),
    database,
    authentication: {
      type: process.env.AZURE_SQL_AUTHENTICATIONTYPE || 'azure-active-directory-default',
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };
}
