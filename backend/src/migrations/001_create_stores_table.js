exports.up = function (knex) {
  return knex.schema.createTable('stores', (table) => {
    table.string('id', 16).primary();
    table.string('type', 20).notNullable();
    table.string('namespace', 64).notNullable().unique();
    table.string('status', 20).notNullable();
    table.string('url', 255).nullable();
    table.text('error_message').nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stores');
};
