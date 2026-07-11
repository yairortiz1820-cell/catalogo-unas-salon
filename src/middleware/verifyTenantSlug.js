module.exports = (req, res, next) => {
  if (req.tienda.slug !== req.params.slug) {
    return res.status(403).json({ error: 'No autorizado para esta tienda' });
  }
  next();
};
