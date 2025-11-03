/** @format */

if (process.env['NODE_ENV'] === 'production' || process.env['CI'] === 'true') process.exit(0);

const husky = (await import('husky')).default;

const husky_ = husky();
if (husky_ !== '') console.log(husky_);
