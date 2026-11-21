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
    // 2. ORG 1 BUSINESSES
    // ==========================================
    console.log('🏬 Seeding Commercial Businesses...');
    
    // Clean up existing demo businesses to ensure fresh state if needed
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
    // 3. USERS (Admin, Dispatcher, Drivers, Business Users)
    // ==========================================
    console.log('👥 Seeding Users across all Roles...');

    // Function to upsert user
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
    // 4. VEHICLES
    // ==========================================
    console.log('🚛 Seeding Fleet Vehicles...');

    const vehiclesData = [
      {
        plate: 'ECO-VAN-01',
        model: 'Electric Van',
        capacityKg: 500,
        driverId: driver1Id,
        status: 'available',
      },
      {
        plate: 'ECO-TRK-02',
        model: 'Medium Truck',
        capacityKg: 1500,
        driverId: driver2Id,
        status: 'available',
      },
      {
        plate: 'ECO-HVY-03',
        model: 'Heavy Hauler',
        capacityKg: 2500,
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
    // 5. PICKUP REQUESTS
    // ==========================================
    console.log('📦 Seeding Pickups across Lifecycles...');

    // Clear old demo pickups for a fresh, clean demo board
    await client.query(`DELETE FROM route_stops WHERE route_id IN (SELECT id FROM routes WHERE organization_id = $1)`, [org1Id]);
    await client.query(`DELETE FROM pickup_requests WHERE organization_id = $1`, [org1Id]);
    await client.query(`DELETE FROM routes WHERE organization_id = $1`, [org1Id]);

    // Pending Pickups
    const p1Res = await client.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, status, waste_category, estimated_weight_kg, notes)
       VALUES ($1, $2, $3, 'pending', 'Plastic', 150.00, 'Pallet of crushed beverage containers at bay 2')
       RETURNING id`,
      [org1Id, businessIds['Metro Supermarket Central'], businessUser1Id],
    );
    const pickup1Id = p1Res.rows[0].id;

    const p2Res = await client.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, status, waste_category, estimated_weight_kg, notes)
       VALUES ($1, $2, $3, 'pending', 'Metal', 320.00, 'Sorted aluminum scrap bins in loading zone')
       RETURNING id`,
      [org1Id, businessIds['Harbor Manufacturing Co'], adminId],
    );
    const pickup2Id = p2Res.rows[0].id;

    // Assigned / In-Progress Pickups (to be bound to Route)
    const p3Res = await client.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, status, waste_category, estimated_weight_kg, assigned_vehicle_id, notes)
       VALUES ($1, $2, $3, 'assigned', 'Paper', 120.00, $4, 'Baled corrugated cardboard')
       RETURNING id`,
      [org1Id, businessIds['TechLogix Industrial Park'], businessUser2Id, vehicleIds['ECO-VAN-01']],
    );
    const pickup3Id = p3Res.rows[0].id;

    const p4Res = await client.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, status, waste_category, estimated_weight_kg, assigned_vehicle_id, notes)
       VALUES ($1, $2, $3, 'in_progress', 'Glass', 90.00, $4, 'Crates of sorted clear glass bottles')
       RETURNING id`,
      [org1Id, businessIds['Metro Supermarket Central'], businessUser1Id, vehicleIds['ECO-VAN-01']],
    );
    const pickup4Id = p4Res.rows[0].id;

    // Completed Pickups
    await client.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, status, waste_category, estimated_weight_kg, assigned_vehicle_id, notes)
       VALUES ($1, $2, $3, 'completed', 'Organic', 210.00, $4, 'Compost bins collected and weighed')`,
      [org1Id, businessIds['Metro Supermarket Central'], businessUser1Id, vehicleIds['ECO-TRK-02']],
    );

    await client.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, status, waste_category, estimated_weight_kg, assigned_vehicle_id, notes)
       VALUES ($1, $2, $3, 'completed', 'Electronic', 450.00, $4, 'Decommissioned server chassis and e-waste')`,
      [org1Id, businessIds['Harbor Manufacturing Co'], adminId, vehicleIds['ECO-TRK-02']],
    );

    // Org 2 Pickup (to verify isolation)
    await client.query(
      `DELETE FROM pickup_requests WHERE organization_id = $1`,
      [org2Id],
    );
    await client.query(
      `INSERT INTO pickup_requests (organization_id, business_id, requested_by, status, waste_category, estimated_weight_kg, notes)
       VALUES ($1, $2, $3, 'pending', 'Paper', 80.00, 'Confidential shredding bin')`,
      [org2Id, org2BusinessId, org2AdminId],
    );

    // ==========================================
    // 6. ACTIVE ROUTE & ROUTE STOPS (for Driver & Dispatcher views)
    // ==========================================
    console.log('🗺️  Seeding Active Route and Stops for ECO-VAN-01...');

    const routeRes = await client.query(
      `INSERT INTO routes (organization_id, vehicle_id, status, total_distance_m, total_duration_s, pickup_count, waypoints)
       VALUES ($1, $2, 'active', 8400.00, 1560.00, 2, $3)
       RETURNING id`,
      [
        org1Id,
        vehicleIds['ECO-VAN-01'],
        JSON.stringify([
          { lat: 40.7077, lng: -74.0119, name: 'Metro Supermarket Central' },
          { lat: 40.7516, lng: -73.9832, name: 'TechLogix Industrial Park' },
        ]),
      ],
    );
    const routeId = routeRes.rows[0].id;

    // Link pickups to route
    await client.query(
      `UPDATE pickup_requests SET route_id = $1 WHERE id IN ($2, $3)`,
      [routeId, pickup3Id, pickup4Id],
    );

    // Create ordered route stops
    await client.query(
      `INSERT INTO route_stops (route_id, pickup_id, stop_order, status, latitude, longitude, address, planned_distance_m, planned_duration_s)
       VALUES 
       ($1, $2, 1, 'arrived', 40.7077, -74.0119, '100 Broadway, New York, NY 10006', 0, 0),
       ($1, $3, 2, 'pending', 40.7516, -73.9832, '450 5th Ave, New York, NY 10018', 8400.00, 1560.00)`,
      [routeId, pickup4Id, pickup3Id],
    );

    // Update vehicle current load
    await client.query(
      `UPDATE vehicles SET current_load_kg = 210.00, status = 'dispatched' WHERE id = $1`,
      [vehicleIds['ECO-VAN-01']],
    );

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully with realistic multi-tenant data!');
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
