const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Source: Hijabistaa (READ-ONLY using anon key from env or argument)
const SOURCE_URL = process.env.SOURCE_SUPABASE_URL || process.argv[2] || 'https://kwfpwejvhlexhbksrzvx.supabase.co';
const SOURCE_ANON_KEY = process.env.SOURCE_ANON_KEY || process.argv[3] || '';
const source = createClient(SOURCE_URL, SOURCE_ANON_KEY);

// 2. Destination: Elite Hijab (Write using service role key)
const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.trim().split('=').map((s, i) => i === 0 ? s : l.trim().substring(l.indexOf('=') + 1)))
);
const dest = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function sync() {
  console.log('🚀 Starting sync from Hijabistaa to Elite Hijab...\n');

  // ── Step 1: Categories ──
  console.log('📥 Fetching categories...');
  const { data: categories, error: catErr } = await source.from('categories').select('*');
  if (catErr) throw new Error('Failed to fetch categories: ' + catErr.message);
  console.log(`Found ${categories.length} categories.`);

  // Insert categories without parent_id first to prevent foreign key errors, then update parent_id
  const cleanedCategories = categories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || null,
    image_url: c.image_url || null,
    count: c.count || null,
    is_active: c.is_active ?? true,
    parent_id: null,
    created_at: c.created_at || new Date().toISOString()
  }));

  const { error: catInsertErr } = await dest.from('categories').upsert(cleanedCategories);
  if (catInsertErr) console.error('Warning inserting categories:', catInsertErr.message);
  else console.log('✅ Categories inserted successfully!');

  // Now update parent_ids
  for (const c of categories) {
    if (c.parent_id) {
      await dest.from('categories').update({ parent_id: c.parent_id }).eq('id', c.id);
    }
  }

  // ── Step 2: Products ──
  console.log('\n📥 Fetching products...');
  const { data: products, error: prodErr } = await source.from('products').select('*');
  if (prodErr) throw new Error('Failed to fetch products: ' + prodErr.message);
  console.log(`Found ${products.length} products.`);

  // Clean products for destination schema
  const cleanedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category_id: p.category_id,
    price: p.price,
    oldPrice: p.oldPrice,
    badge: p.badge,
    rating: p.rating,
    is_active: p.is_active ?? true,
    is_featured: p.is_featured ?? false,
    description: p.description,
    short_description: p.short_description,
    created_at: p.created_at || new Date().toISOString(),
    seo_title: p.seo_title,
    seo_description: p.seo_description,
    featured_image_url: p.featured_image_url,
    color_group_id: p.color_group_id,
    size: p.size,
    color_name: p.color_name,
    color_hex: p.color_hex
  }));

  // Batch insert products
  const { error: prodInsertErr } = await dest.from('products').upsert(cleanedProducts);
  if (prodInsertErr) console.error('Warning inserting products:', prodInsertErr.message);
  else console.log(`✅ ${cleanedProducts.length} Products inserted successfully!`);

  // ── Step 3: Product Images ──
  console.log('\n📥 Fetching product images...');
  const { data: productImages, error: imgErr } = await source.from('product_images').select('*');
  if (imgErr) console.warn('Warning fetching product_images:', imgErr.message);
  if (productImages && productImages.length > 0) {
    console.log(`Found ${productImages.length} product images.`);
    // Insert in batches of 50
    for (let i = 0; i < productImages.length; i += 50) {
      const batch = productImages.slice(i, i + 50);
      const { error: bErr } = await dest.from('product_images').upsert(batch);
      if (bErr) console.warn('Warning inserting image batch:', bErr.message);
    }
    console.log(`✅ ${productImages.length} Product images synced!`);
  }

  // ── Step 4: Product Colors ──
  console.log('\n📥 Fetching product colors...');
  const { data: productColors, error: colErr } = await source.from('product_colors').select('*');
  if (colErr) console.warn('Warning fetching product_colors:', colErr.message);
  if (productColors && productColors.length > 0) {
    console.log(`Found ${productColors.length} product colors.`);
    // Insert in batches of 50
    for (let i = 0; i < productColors.length; i += 50) {
      const batch = productColors.slice(i, i + 50);
      const { error: cErr } = await dest.from('product_colors').upsert(batch);
      if (cErr) console.warn('Warning inserting colors batch:', cErr.message);
    }
    console.log(`✅ ${productColors.length} Product colors synced!`);
  }

  // ── Step 5: Product Information ──
  console.log('\n📥 Fetching product information...');
  const { data: productInfo, error: infoErr } = await source.from('product_information').select('*');
  if (infoErr) console.warn('Warning fetching product_information:', infoErr.message);
  if (productInfo && productInfo.length > 0) {
    console.log(`Found ${productInfo.length} product info specs.`);
    for (let i = 0; i < productInfo.length; i += 50) {
      const batch = productInfo.slice(i, i + 50);
      const { error: iErr } = await dest.from('product_information').upsert(batch);
      if (iErr) console.warn('Warning inserting info batch:', iErr.message);
    }
    console.log(`✅ ${productInfo.length} Product information records synced!`);
  }

  // ── Step 6: Hero Slides ──
  console.log('\n📥 Fetching hero slides...');
  const { data: heroSlides, error: heroErr } = await source.from('hero_slides').select('*');
  if (heroSlides && heroSlides.length > 0) {
    console.log(`Found ${heroSlides.length} hero slides.`);
    const { error: hErr } = await dest.from('hero_slides').upsert(heroSlides);
    if (hErr) console.warn('Warning inserting hero slides:', hErr.message);
    else console.log(`✅ ${heroSlides.length} Hero slides synced!`);
  }

  // ── Step 7: Testimonials ──
  console.log('\n📥 Fetching testimonials...');
  const { data: testimonials, error: testErr } = await source.from('testimonials').select('*');
  if (testimonials && testimonials.length > 0) {
    console.log(`Found ${testimonials.length} testimonials.`);
    const { error: tErr } = await dest.from('testimonials').upsert(testimonials);
    if (tErr) console.warn('Warning inserting testimonials:', tErr.message);
    else console.log(`✅ ${testimonials.length} Testimonials synced!`);
  }

  // ── Step 8: Global FAQs ──
  console.log('\n📥 Fetching global FAQs...');
  const { data: faqs, error: faqErr } = await source.from('global_faqs').select('*');
  if (faqs && faqs.length > 0) {
    console.log(`Found ${faqs.length} FAQs.`);
    const { error: fErr } = await dest.from('global_faqs').upsert(faqs);
    if (fErr) console.warn('Warning inserting FAQs:', fErr.message);
    else console.log(`✅ ${faqs.length} FAQs synced!`);
  }

  // ── Step 9: Update local db.json cache ──
  console.log('\n📥 Updating local lib/db.json backup cache...');
  const dbPath = path.join(__dirname, '..', 'lib', 'db.json');
  let localDb = {};
  try {
    localDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {}

  localDb.categories = categories || localDb.categories;
  localDb.products = cleanedProducts || localDb.products;
  localDb.product_colors = productColors || localDb.product_colors;
  localDb.product_images = productImages || localDb.product_images;
  localDb.product_information = productInfo || localDb.product_information;
  if (heroSlides) localDb.hero_slides = heroSlides;
  if (testimonials) localDb.testimonials = testimonials;
  if (faqs) localDb.global_faqs = faqs;

  fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2), 'utf8');
  console.log('✅ Local db.json cache updated!');

  console.log('\n🎉 ALL DONE! All products, categories, photos and colors are now in Elite Hijab!');
}

sync().catch(err => {
  console.error('\n❌ Sync failed:', err);
  process.exit(1);
});
