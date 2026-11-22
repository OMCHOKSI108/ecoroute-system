import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

async function seed() {
  console.log('🌱 Starting EcoRoute QA Seed Script...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // ==========================================
    // 1. ORGANIZATIONS
    // ==========================================
    console.log('🏢 Seeding Organizations...');
    
    // Org 1: EcoRoute Demo Logistics
    const org1Res = await client.query(
      `INSERT INTO organizations (name, email, phone, address, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
       RETURNING id, name`,
      [
        'EcoRoute Demo Logistics',
        'ops@ecoroute.demo',
        '+1-555-0100',
        '100 Eco Boulevard, Suite 500, New York, NY',
      ],
    );
    const org1Id = org1Res.rows[0].id;

    // Org 2: GreenCycle Beta Corp (for multi-tenant isolation verification)
    const org2Res = await client.query(
      `INSERT INTO organizations (name, email, phone, address, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
       RETURNING id, name`,
      [
        'GreenCycle Beta Corp',
        'contact@greencycle.demo',
        '+1-555-0200',
        '400 Green Way, Newark, NJ',
      ],
    );
    const org2Id = org2Res.rows[0].id;

    // ==========================================
    // 2. WASTE CATEGORIES
    // ==========================================
    console.log('♻️ Seeding Waste Categories...');
    const wasteCategoriesData = [
      { name: 'Plastic Recyclables', desc: 'High-density polyethylene (HDPE), PET bottles, and rigid thermoplastics.' },
      { name: 'Corrugated Cardboard & Paper', desc: 'Baled corrugated packaging boxes, mixed office paper, and newsprint.' },
      { name: 'Glass & Bottled Containers', desc: 'Sorted clear, amber, and green beverage containers and culinary glass.' },
      { name: 'Organic & Food Scraps', desc: 'Compostable produce, commercial food preparation scraps, and organic matter.' },
      { name: 'Scrap Metal & Aluminum', desc: 'Ferrous and non-ferrous manufacturing shavings, aluminum beverage cans.' },
      { name: 'Electronic & IT Waste', desc: 'Decommissioned server chassis, circuit boards, batteries, and peripherals.' },
    ];

    for (const wc of wasteCategoriesData) {
      await client.query(
        `INSERT INTO waste_categories (organization_id, name, description, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (organization_id, name) DO UPDATE SET
           description = EXCLUDED.description,
           is_active = true,
           updated_at = NOW()`,
        [org1Id, wc.name, wc.desc],
      );
    }

    // ==========================================
    // 3. COMMERCIAL BUSINESSES
    // ==========================================
    console.log('🏬 Seeding Commercial Businesses...');
    
    const businessesData = [
      {
        name: 'Metro Supermarket Central',
        email: 'logistics@metrosupermarket.demo',
        phone: '+1-555-1111',
        address: '100 Broadway, New York, NY 10006',
        lat: 40.7077,
        lng: -74.0119,
        categories: ['Plastic', 'Paper', 'Glass', 'Organic'],
      },
      {
        name: 'TechLogix Industrial Park',
        email: 'facilities@techlogix.demo',
        phone: '+1-555-2222',
        address: '450 5th Ave, New York, NY 10018',
        lat: 40.7516,
        lng: -73.9832,
        categories: ['Electronic', 'Metal', 'Plastic'],
      },
      {
        name: 'Harbor Manufacturing Co',
        email: 'ops@harbormanufacturing.demo',
        phone: '+1-555-3333',
        address: '730 8th Ave, New York, NY 10036',
        lat: 40.7589,
        lng: -73.9882,
        categories: ['Metal', 'Plastic', 'Electronic'],
      },
      {
        name: 'Hudson Bio-Chemicals Hub',
        email: 'facilities@hudsonbio.demo',
        phone: '+1-555-4444',
        address: '500 W 33rd St, New York, NY 10001',
        lat: 40.7538,
        lng: -74.0022,
        categories: ['Organic', 'Plastic', 'Glass'],
      },
      {
        name: 'Empire Logistics Center',
        email: 'depot@empirelogistics.demo',
        phone: '+1-555-5555',
        address: '31-10 47th Ave, Long Island City, NY 11101',
        lat: 40.7441,
        lng: -73.9352,
        categories: ['Paper', 'Plastic', 'Metal'],
      },
      {
        name: 'GreenPoint Materials Terminal',
        email: 'terminal@greenpoint.demo',
        phone: '+1-555-6666',
        address: '25 Kent Ave, Brooklyn, NY 11249',
        lat: 40.7225,
        lng: -73.9578,
        categories: ['Metal', 'Glass', 'Plastic'],
      },
    ];

    const businessIds: Record<string, string> = {};

    for (const b of businessesData) {
      const bRes = await client.query(
        `INSERT INTO businesses (organization_id, name, contact_email, contact_phone, address, latitude, longitude, location, waste_categories, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($7, $6), 4326), $8, true)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [org1Id, b.name, b.email, b.phone, b.address, b.lat, b.lng, b.categories],
      );

      if (bRes.rows.length > 0) {
        businessIds[b.name] = bRes.rows[0].id;
      } else {
        const existing = await client.query(
          `SELECT id FROM businesses WHERE organization_id = $1 AND name = $2`,
          [org1Id, b.name],
        );
        businessIds[b.name] = existing.rows[0].id;
      }
    }

    // Org 2 Business
    const bOrg2Res = await client.query(
      `INSERT INTO businesses (organization_id, name, contact_email, contact_phone, address, latitude, longitude, location, waste_categories, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($7, $6), 4326), $8, true)
       RETURNING id`,
      [
        org2Id,
        'GreenCycle Facility Alpha',
        'alpha@greencycle.demo',
        '+1-555-9999',
        '1200 Madison Ave, New York, NY 10128',
        40.7829,
        -73.9574,
        ['Paper', 'Plastic'],
      ],
    ).catch(async () => {
      return client.query(
        `SELECT id FROM businesses WHERE organization_id = $1 AND name = $2`,
        [org2Id, 'GreenCycle Facility Alpha'],
      );
    });
    const org2BusinessId = bOrg2Res.rows[0].id;

    // ==========================================
    // 4. PICKUP LOCATIONS (Physical Loading Docks)
    // ==========================================
    console.log('📍 Seeding Physical Pickup Locations...');
    await client.query(`DELETE FROM pickup_locations WHERE organization_id = $1`, [org1Id]);

    const locationsData = [
      {
        biz: 'Metro Supermarket Central',
        name: 'Dock A - Grocery Receiving Bay',
        address: '100 Broadway Rear Dock, New York, NY 10006',
        lat: 40.7077,
        lng: -74.0119,
      },
      {
        biz: 'Metro Supermarket Central',
        name: 'Compactor Terminal 2',
        address: '100 Broadway Sub-Basement, New York, NY 10006',
        lat: 40.7079,
        lng: -74.0121,
      },
      {
        biz: 'TechLogix Industrial Park',
        name: 'Warehouse Loading Ramp 3',
        address: '450 5th Ave Loading Gate, New York, NY 10018',
        lat: 40.7516,
        lng: -73.9832,
      },
      {
        biz: 'TechLogix Industrial Park',
        name: 'Server Room E-Waste Depot',
        address: '450 5th Ave Tower B, Floor 4, New York, NY 10018',
        lat: 40.7518,
        lng: -73.9830,
      },
      {
        biz: 'Harbor Manufacturing Co',
        name: 'Heavy Metal Scrap Yard',
        address: '730 8th Ave West Wing, New York, NY 10036',
        lat: 40.7589,
        lng: -73.9882,
      },
      {
        biz: 'Hudson Bio-Chemicals Hub',
        name: 'Main Biological Waste Port',
        address: '500 W 33rd St Bay 1, New York, NY 10001',
        lat: 40.7538,
        lng: -74.0022,
      },
      {
        biz: 'Empire Logistics Center',
        name: 'Crossdock Loading Station 12',
        address: '31-10 47th Ave Dock 12, Long Island City, NY 11101',
        lat: 40.7441,
        lng: -73.9352,
      },
      {
        biz: 'GreenPoint Materials Terminal',
        name: 'Materials Processing Line 1',
        address: '25 Kent Ave Gate A, Brooklyn, NY 11249',
        lat: 40.7225,
        lng: -73.9578,
      },
    ];

    for (const loc of locationsData) {
      const bId = businessIds[loc.biz];
      if (bId) {
        await client.query(
          `INSERT INTO pickup_locations (organization_id, business_id, name, address, latitude, longitude, location, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326), true)`,
          [org1Id, bId, loc.name, loc.address, loc.lat, loc.lng],
        );
      }
    }

    // ==========================================
    // 5. USERS (Admin, Dispatcher, Drivers, Business Users)
    // ==========================================
    console.log('👥 Seeding Users across all Roles...');

    async function upsertUser(
      orgId: string,
      email: string,
      first: string,
      last: string,
      role: 'admin' | 'dispatcher' | 'driver' | 'business_user',
      phone: string,
      businessId: string | null = null,
      driverStatus: string | null = null,
    ): Promise<string> {
      const res = await client.query(
        `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, phone, business_id, driver_status, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         ON CONFLICT (email) DO UPDATE SET 
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           role = EXCLUDED.role,
           phone = EXCLUDED.phone,
           business_id = EXCLUDED.business_id,
           driver_status = EXCLUDED.driver_status,
           is_active = true,
           updated_at = NOW()
         RETURNING id`,
        [orgId, email, passwordHash, first, last, role, phone, businessId, driverStatus],
      );
      return res.rows[0].id;
    }

    // Org 1 Users
    const adminId = await upsertUser(
      org1Id,
      'admin@ecoroute.demo',
      'Alice',
      'Admin',
      'admin',
      '+1-555-0101',
    );

    const dispatcherId = await upsertUser(
      org1Id,
      'dispatcher@ecoroute.demo',
      'David',
      'Dispatcher',
      'dispatcher',
      '+1-555-0102',
    );

    const driver1Id = await upsertUser(
      org1Id,
      'driver.dave@ecoroute.demo',
      'Dave',
      'Driver',
      'driver',
      '+1-555-0103',
      null,
      'available',
    );

    const driver2Id = await upsertUser(
      org1Id,
      'driver.dan@ecoroute.demo',
      'Dan',
      'Driver',
      'driver',
      '+1-555-0104',
      null,
      'available',
    );

    const driver3Id = await upsertUser(
      org1Id,
      'driver.diana@ecoroute.demo',
      'Diana',
      'Driver',
      'driver',
      '+1-555-0107',
      null,
      'available',
    );

    const driver4Id = await upsertUser(
      org1Id,
      'driver.derek@ecoroute.demo',
      'Derek',
      'Driver',
      'driver',
      '+1-555-0108',
      null,
      'available',
    );

    const businessUser1Id = await upsertUser(
      org1Id,
      'business.metro@ecoroute.demo',
      'Marcus',
      'MetroManager',
      'business_user',
      '+1-555-0105',
      businessIds['Metro Supermarket Central'],
    );

    const businessUser2Id = await upsertUser(
      org1Id,
      'business.tech@ecoroute.demo',
      'Tina',
      'TechLead',
      'business_user',
      '+1-555-0106',
      businessIds['TechLogix Industrial Park'],
    );

    // Org 2 Users
    const org2AdminId = await upsertUser(
      org2Id,
      'admin@greencycle.demo',
      'Grace',
      'GreenAdmin',
      'admin',
      '+1-555-0201',
    );

    // ==========================================
    // 6. FLEET VEHICLES
    // ==========================================
    console.log('🚛 Seeding Fleet Vehicles...');

    const vehiclesData = [
      {
        plate: 'ECO-VAN-01',
        model: 'Electric Van',
        capacityKg: 600,
        driverId: driver1Id,
        status: 'available',
      },
      {
        plate: 'ECO-TRK-02',
        model: 'Medium Logistics Truck',
        capacityKg: 1500,
        driverId: driver2Id,
        status: 'available',
      },
      {
        plate: 'ECO-HVY-03',
        model: 'Heavy Hauler 24T',
        capacityKg: 2800,
        driverId: driver3Id,
        status: 'available',
      },
      {
        plate: 'ECO-EV-04',
        model: 'Zero-Emission Flatbed',
        capacityKg: 1200,
        driverId: driver4Id,
        status: 'available',
      },
      {
        plate: 'ECO-CMP-05',
        model: 'High-Capacity Compactor',
        capacityKg: 4000,
        driverId: null,
        status: 'available',
      },
    ];

    const vehicleIds: Record<string, string> = {};

    for (const v of vehiclesData) {
      const vRes = await client.query(
        `INSERT INTO vehicles (organization_id, plate_number, model, capacity_kg, current_load_kg, driver_id, status)
         VALUES ($1, $2, $3, $4, 0, $5, $6)
         ON CONFLICT (organization_id, plate_number) DO UPDATE SET
           model = EXCLUDED.model,
           capacity_kg = EXCLUDED.capacity_kg,
           driver_id = EXCLUDED.driver_id,
           status = EXCLUDED.status,
           updated_at = NOW()
         RETURNING id`,
        [org1Id, v.plate, v.model, v.capacityKg, v.driverId, v.status],
      );
      vehicleIds[v.plate] = vRes.rows[0].id;
    }

    // ==========================================
    // 7. PICKUP REQUESTS ACROSS LIFECYCLES
    // ==========================================
    console.log('📦 Seeding Rich Pickups across Lifecycles...');

    // Clean up existing stops, pickups, routes for org1 to ensure clean consistency
    await client.query(`DELETE FROM route_stops WHERE route_id IN (SELECT id FROM routes WHERE organization_id = $1)`, [org1Id]);
    await client.query(`DELETE FROM pickup_requests WHERE organization_id = $1`, [org1Id]);
    await client.query(`DELETE FROM routes WHERE organization_id = $1`, [org1Id]);

    // Helper to insert pickup
    async function insertPickup(
      bizName: string,
      requestedBy: string,
      status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled',
      category: string,
      weight: number,
      notes: string,
      vehicleId: string | null = null,
    ): Promise<string> {
      const res = await client.query(
        `INSERT INTO pickup_requests (organization_id, business_id, requested_by, status, waste_category, estimated_weight_kg, assigned_vehicle_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [org1Id, businessIds[bizName], requestedBy, status, category, weight, vehicleId, notes],
      );
      return res.rows[0].id;
    }

    // Pending Pickups (Waiting for Dispatcher to batch/assign)
    const pendingP1 = await insertPickup(
      'Metro Supermarket Central',
      businessUser1Id,
      'pending',
      'Plastic Recyclables',
      160.00,
      'Pallet of crushed beverage containers at Bay 2',
    );
    const pendingP2 = await insertPickup(
      'Harbor Manufacturing Co',
      adminId,
      'pending',
      'Scrap Metal & Aluminum',
      340.00,
      'Sorted aluminum turnings in steel tote bins',
    );
    const pendingP3 = await insertPickup(
      'Hudson Bio-Chemicals Hub',
      adminId,
      'pending',
      'Organic & Food Scraps',
      190.00,
      'Biodegradable organic pulp from pilot fermentation',
    );
    const pendingP4 = await insertPickup(
      'GreenPoint Materials Terminal',
      dispatcherId,
      'pending',
      'Glass & Bottled Containers',
      220.00,
      'Mixed cullet crates ready for processing line',
    );

    // Assigned Pickups (Allocated to vehicles, awaiting route dispatch)
    const assignedP1 = await insertPickup(
      'Empire Logistics Center',
      dispatcherId,
      'assigned',
      'Corrugated Cardboard & Paper',
      280.00,
      'Baled double-wall corrugated cardboard from crossdock',
      vehicleIds['ECO-TRK-02'],
    );
    const assignedP2 = await insertPickup(
      'TechLogix Industrial Park',
      businessUser2Id,
      'assigned',
      'Electronic & IT Waste',
      175.00,
      'Decommissioned rack servers and battery backups',
      vehicleIds['ECO-TRK-02'],
    );

    // Pickups for Active Route (ECO-VAN-01)
    const activeP1 = await insertPickup(
      'Metro Supermarket Central',
      businessUser1Id,
      'in_progress',
      'Plastic Recyclables',
      120.00,
      'Clean shrink wrap and baled LDPE plastics',
      vehicleIds['ECO-VAN-01'],
    );
    const activeP2 = await insertPickup(
      'TechLogix Industrial Park',
      businessUser2Id,
      'in_progress',
      'Corrugated Cardboard & Paper',
      95.00,
      'Office paper bales and flat-pack shipping boxes',
      vehicleIds['ECO-VAN-01'],
    );
    const activeP3 = await insertPickup(
      'Harbor Manufacturing Co',
      adminId,
      'in_progress',
      'Scrap Metal & Aluminum',
      130.00,
      'Lightweight aluminum extrusions at Gate 4',
      vehicleIds['ECO-VAN-01'],
    );

    // Historical Completed Pickups
    await insertPickup(
      'Metro Supermarket Central',
      businessUser1Id,
      'completed',
      'Organic & Food Scraps',
      240.00,
      'Compost bins successfully collected and weighed',
      vehicleIds['ECO-CMP-05'],
    );
    await insertPickup(
      'Hudson Bio-Chemicals Hub',
      adminId,
      'completed',
      'Glass & Bottled Containers',
      310.00,
      'Chemical glassware safely collected with manifest',
      vehicleIds['ECO-TRK-02'],
    );
    await insertPickup(
      'Empire Logistics Center',
      dispatcherId,
      'completed',
      'Corrugated Cardboard & Paper',
      420.00,
      'High-volume cardboard collection completed on schedule',
      vehicleIds['ECO-HVY-03'],
    );

    // Cancelled Pickup
    await insertPickup(
      'TechLogix Industrial Park',
      businessUser2Id,
      'cancelled',
      'Electronic & IT Waste',
      50.00,
      'Pickup request cancelled by customer — rescheduled for next quarter',
    );

    // Org 2 Pickup (to verify isolation)
    await client.query(`DELETE FROM pickup_requests WHERE organization_id = $1`, [org2Id]);
    await client.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, status, waste_category, estimated_weight_kg, notes)
       VALUES ($1, $2, $3, 'pending', 'Corrugated Cardboard & Paper', 80.00, 'Confidential document shredding bin')`,
      [org2Id, org2BusinessId, org2AdminId],
    );

    // ==========================================
    // 8. ACTIVE & HISTORICAL ROUTES
    // ==========================================
    console.log('🗺️  Seeding Active & Historical Routes and Stops...');

    // 1. ACTIVE ROUTE for ECO-VAN-01
    const activeRouteRes = await client.query(
      `INSERT INTO routes (organization_id, vehicle_id, status, total_distance_m, total_duration_s, pickup_count, waypoints)
       VALUES ($1, $2, 'active', 12600.00, 2100.00, 3, $3)
       RETURNING id`,
      [
        org1Id,
        vehicleIds['ECO-VAN-01'],
        JSON.stringify([
          { lat: 40.7077, lng: -74.0119, name: 'Metro Supermarket Central' },
          { lat: 40.7516, lng: -73.9832, name: 'TechLogix Industrial Park' },
          { lat: 40.7589, lng: -73.9882, name: 'Harbor Manufacturing Co' },
        ]),
      ],
    );
    const activeRouteId = activeRouteRes.rows[0].id;

    // Link active pickups to route
    await client.query(
      `UPDATE pickup_requests SET route_id = $1 WHERE id IN ($2, $3, $4)`,
      [activeRouteId, activeP1, activeP2, activeP3],
    );

    // Ordered route stops: Stop 1 is arrived, Stop 2 is pending, Stop 3 is pending
    await client.query(
      `INSERT INTO route_stops (route_id, pickup_id, stop_order, status, latitude, longitude, address, planned_distance_m, planned_duration_s)
       VALUES 
       ($1, $2, 1, 'arrived', 40.7077, -74.0119, '100 Broadway, New York, NY 10006', 0, 0),
       ($1, $3, 2, 'pending', 40.7516, -73.9832, '450 5th Ave, New York, NY 10018', 6800.00, 1150.00),
       ($1, $4, 3, 'pending', 40.7589, -73.9882, '730 8th Ave, New York, NY 10036', 5800.00, 950.00)`,
      [activeRouteId, activeP1, activeP2, activeP3],
    );

    await client.query(
      `UPDATE vehicles SET current_load_kg = 345.00, status = 'dispatched' WHERE id = $1`,
      [vehicleIds['ECO-VAN-01']],
    );

    // 2. COMPLETED HISTORICAL ROUTE for ECO-CMP-05
    const compRouteRes = await client.query(
      `INSERT INTO routes (organization_id, vehicle_id, status, total_distance_m, total_duration_s, pickup_count, waypoints)
       VALUES ($1, $2, 'completed', 15200.00, 2400.00, 2, $3)
       RETURNING id`,
      [
        org1Id,
        vehicleIds['ECO-CMP-05'],
        JSON.stringify([
          { lat: 40.7077, lng: -74.0119, name: 'Metro Supermarket Central' },
          { lat: 40.7441, lng: -73.9352, name: 'Empire Logistics Center' },
        ]),
      ],
    );
    const compRouteId = compRouteRes.rows[0].id;

    await client.query(
      `INSERT INTO route_stops (route_id, pickup_id, stop_order, status, latitude, longitude, address, planned_distance_m, planned_duration_s)
       VALUES 
       ($1, NULL, 1, 'completed', 40.7077, -74.0119, '100 Broadway, New York, NY 10006', 0, 0),
       ($1, NULL, 2, 'completed', 40.7441, -73.9352, '31-10 47th Ave, Long Island City, NY 11101', 15200.00, 2400.00)`,
      [compRouteId],
    );

    await client.query('COMMIT');
    console.log('✅ EcoRoute Database successfully reseeded with rich, production-grade data!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
