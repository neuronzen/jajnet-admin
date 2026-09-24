import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services.dart';
import '../theme.dart';
import 'customer_detail.dart';

class CustomersPage extends StatefulWidget {
  const CustomersPage({super.key});
  @override
  State<CustomersPage> createState() => _CustomersPageState();
}

class _CustomersPageState extends State<CustomersPage> {
  String _search = '';
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: AdminService.allUsers,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        var docs = snap.data?.docs ?? [];
        var list = docs.map((d) {
          final m = d.data() as Map<String, dynamic>;
          return {'id': d.id, ...m};
        }).toList();

        if (_search.isNotEmpty) {
          final q = _search.toLowerCase();
          list = list.where((m) {
            final n = (m['name'] ?? '').toString().toLowerCase();
            final p = (m['phone'] ?? '').toString();
            final e = (m['email'] ?? '').toString().toLowerCase();
            return n.contains(q) || p.contains(q) || e.contains(q);
          }).toList();
        }

        if (_filter != 'all') {
          list = list
              .where((m) => (m['status'] ?? '') == _filter)
              .toList();
        }

        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      onChanged: (v) => setState(() => _search = v),
                      decoration: const InputDecoration(
                        hintText: 'নাম, ফোন বা ইমেইল দিয়ে খুঁজুন...',
                        prefixIcon: Icon(Icons.search_rounded,
                            color: AC.primary, size: 22),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  _filterChip('সব', 'all'),
                  const SizedBox(width: 8),
                  _filterChip('Active', 'active'),
                  const SizedBox(width: 8),
                  _filterChip('Due', 'due'),
                ],
              ),
              const SizedBox(height: 20),
              Text('মোট ${list.length} জন',
                  style: GoogleFonts.hindSiliguri(
                      fontSize: 13, color: AC.grey)),
              const SizedBox(height: 12),
              Expanded(
                child: list.isEmpty
                    ? const Center(child: Text('কোনো গ্রাহক নেই'))
                    : ListView.separated(
                        itemCount: list.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 10),
                        itemBuilder: (_, i) {
                          final m = list[i];
                          return _customerCard(m);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _filterChip(String label, String value) {
    final active = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: active ? AC.primary : AC.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: active ? null : AC.cardShadow,
        ),
        child: Text(label,
            style: GoogleFonts.hindSiliguri(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: active ? Colors.white : AC.ink)),
      ),
    );
  }

  Widget _customerCard(Map<String, dynamic> m) {
    final status = (m['status'] ?? '').toString();
    final color = status == 'active'
        ? AC.success
        : status == 'due'
            ? AC.warning
            : AC.error;
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => CustomerDetailPage(
              uid: m['id'] as String, initial: m),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AC.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AC.cardShadow,
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AC.primary.withOpacity(0.15),
              child: Text(
                (m['name'] ?? 'U')
                    .toString()
                    .substring(0, 1)
                    .toUpperCase(),
                style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AC.primary),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(m['name'] ?? '',
                      style: GoogleFonts.hindSiliguri(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AC.ink)),
                  const SizedBox(height: 2),
                  Text(
                      '${m['phone'] ?? ''} • ${m['package'] ?? ''}',
                      style: GoogleFonts.hindSiliguri(
                          fontSize: 12, color: AC.grey)),
                  const SizedBox(height: 2),
                  Text(m['address'] ?? '',
                      style: GoogleFonts.hindSiliguri(
                          fontSize: 11, color: AC.grey)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(status.toUpperCase(),
                      style: GoogleFonts.poppins(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: color)),
                ),
                const SizedBox(height: 6),
                Text('৳${m['dueAmount'] ?? 0}',
                    style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: ((m['dueAmount'] ?? 0) as num) > 0
                            ? AC.error
                            : AC.success)),
              ],
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right_rounded,
                color: AC.grey),
          ],
        ),
      ),
    );
  }
}
