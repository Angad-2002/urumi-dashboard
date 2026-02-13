exports.up = function (knex) {
  return knex.schema.alterTable('stores', (table) => {
    table.string('name', 255).nullable();
    table.string('user_id', 128).nullable();
    table.string('admin_url', 255).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('stores', (table) => {
    table.dropColumn('name');
    table.dropColumn('user_id');
    table.dropColumn('admin_url');
  });
};
