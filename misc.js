// Just handy during development

const cons_json = (ob) => console.dir(ob, {depth: null, colors: true});
const re_req = () => Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });