import { Category } from '../_types/category';

export const mainCategories: Category[] = [
  { id: 'todo', name: 'Todo', slug: 'todo' },
  { id: 'accesorios', name: 'Accesorios', slug: 'accesorios' },
  { id: 'buzos', name: 'Buzos', slug: 'buzos' },
  { id: 'bolsos', name: 'Bolsos', slug: 'bolsos' },
  { id: 'canilleras', name: 'Canilleras', slug: 'canilleras' },
  { id: 'chanclas', name: 'Chanclas', slug: 'chanclas' },
  { id: 'gorros', name: 'Gorros', slug: 'gorros' },
  { id: 'medias', name: 'Medias', slug: 'medias' },
  { id: 'mochilas', name: 'Mochilas', slug: 'mochilas' },
  { id: 'neceser', name: 'Neceser', slug: 'neceser' },
  { id: 'pantalones', name: 'Pantalones', slug: 'pantalones' },
  { id: 'remeras', name: 'Remeras', slug: 'remeras' },
];

const CategoryData = {
  mainCategories,
};

export default CategoryData;
