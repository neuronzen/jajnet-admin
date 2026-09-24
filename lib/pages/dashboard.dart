import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services.dart';
import '../theme.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: AdminService.allUsers,
      builder: (context, usersSnap) {
        return StreamBuilder<QuerySnapshot>(
stream: AdminService.allPayments,
builder: (context, paySnap) {
  final users = usersSnap.data?.docs ?? [];
  final payments = paySnap.data?.docs ?? [];

  int active = 0, due = 0, expired = 0;
  double dueAmount = 0;
  for (final d in users) {
    final m = d.data() as Map<String, dynamic>;
    final s = (m['status'] ?? '').toString();
    if (s == 'active') active++;
    if (s == 'due') due++;
    if (s == 'expired') expired++;
    dueAmount += ((m['dueAmount'] ?? 0) as num).toDouble();
  }

  int pending = 0;
  double todayCollection = 0;
  final today = DateTime.now();
  for (final d in payments) {
    final m = d.data() as Map<String, dynamic>;
    if (m['status'] == 'pending') pending++;
    if (m['status'] == 'verified' && m['verifiedAt'] != null) {
      final ts = m['verifiedAt'];
      if (ts is Timestamp) {
        final dt = ts.toDate();
        if (dt.year == today.year &&
            dt.month == today.month &&
            dt.day == today.day) {
          todayCollection +=
              ((m['amount'] ?? 0) as num).toDouble();
        }
      }
    }
  }

  final recent = users.take(5).toList();

  return SingleChildScrollView(
    padding: const EdgeInsets.all(20),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _welcomeCard(),
        const SizedBox(height: 22),
        Text('ব্যবসার সারসংক্ষেপ',
            style: GoogleFonts.hindSiliguri(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AC.ink)),
        const SizedBox(height: 12),
        _statGrid([
          _stat('মোট গ্রাহক', '${users.length}',
              Icons.people_alt_rounded, AC.info),
          _stat('Active', '$active',
              Icons.check_circle_rounded, AC.success),
          _stat('Due', '$due',
              Icons.warning_amber_rounded, AC.warning),
          _stat('Expired', '$expired',
              Icons.cancel_rounded, AC.error),
          _stat('পেন্ডিং পেমেন্ট', '$pending',
              Icons.pending_actions_rounded, AC.warning),
          _stat('মোট বকেয়া',
              '৳${dueAmount.toStringAsFixed(0)}',
              Icons.account_balance_wallet_rounded,
              AC.error),
        ]),
        const SizedBox(height: 22),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: AC.heroGradient,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: AC.primary.withOpacity(0.25),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.22),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.today_rounded,
                    color: Colors.white, size: 26),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Text('আজকের আদায়',
                        style: GoogleFonts.hindSiliguri(
                            fontSize: 13,
                            color: Colors.white
                                .withOpacity(0.92))),
                    const SizedBox(height: 2),
                    Text(
                        '৳${todayCollection.toStringAsFixed(0)}',
                        style: GoogleFonts.poppins(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: Colors.white)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('সাম্প্রতিক গ্রাহক',
                style: GoogleFonts.hindSiliguri(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AC.ink)),
            Text('${users.length} জন',
                style: GoogleFonts.hindSiliguri(
                    fontSize: 12, color: AC.grey)),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AC.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: AC.cardShadow,
          ),
          child: recent.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(20),
                  child: Center(
                    child: Text('কোনো গ্রাহক নেই',
                        style: GoogleFonts.hindSiliguri(
                            color: AC.grey)),
                  ),
                )
              : Column(
                  children: recent.map((d) {
                    final m =
                        d.data() as Map<String, dynamic>;
                    final s = (m['status'] ?? '')
                        .toString();
                    final color = s == 'active'
                        ? AC.success
                        : s == 'due'
                            ? AC.warning
                            : AC.error;
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                          vertical: 6),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 20,
                            backgroundColor: AC.primary
                                .withOpacity(0.15),
                            child: Text(
                              (m['name'] ?? 'U')
                                  .toString()
                                  .substring(0, 1)
                                  .toUpperCase(),
                              style: GoogleFonts.poppins(
                                  fontWeight:
                                      FontWeight.w700,
                                  color: AC.primary),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                Text(m['name'] ?? '',
                                    style: GoogleFonts
                                        .hindSiliguri(
                                            fontWeight:
                                                FontWeight
                                                    .w600,
                                            color: AC.ink)),
                                Text(
                                    '${m['package'] ?? ''} • ৳${m['packagePrice'] ?? 0}',
                                    style: GoogleFonts
                                        .hindSiliguri(
                                            fontSize: 12,
                                            color:
                                                AC.grey)),
                              ],
                            ),
                          ),
                          Container(
                            padding:
                                const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4),
                            decoration: BoxDecoration(
                              color:
                                  color.withOpacity(0.12),
                              borderRadius:
                                  BorderRadius.circular(20),
                            ),
                            child: Text(s.toUpperCase(),
                                style: GoogleFonts.poppins(
                                    fontSize: 10,
                                    fontWeight:
                                        FontWeight.w600,
                                    color: color)),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
        ),
        const SizedBox(height: 30),
      ],
    ),
  );
},
        );
      },
    );
  }

  Widget _welcomeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: AC.heroGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
BoxShadow(
  color: AC.primary.withOpacity(0.25),
  blurRadius: 22,
  offset: const Offset(0, 10),
),
        ],
      ),
      child: Row(
        children: [
Expanded(
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('স্বাগতম 👋',
          style: GoogleFonts.hindSiliguri(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Colors.white)),
      const SizedBox(height: 4),
      Text('আপনার JAJ Net ব্যবসার সারসংক্ষেপ',
          style: GoogleFonts.hindSiliguri(
              fontSize: 13,
              color: Colors.white.withOpacity(0.92))),
      const SizedBox(height: 12),
      Text(
          DateFormat('EEEE, dd MMMM yyyy')
              .format(DateTime.now()),
          style: GoogleFonts.poppins(
              fontSize: 12,
              color: Colors.white.withOpacity(0.88))),
    ],
  ),
),
Container(
  width: 62,
  height: 62,
  decoration: BoxDecoration(
    color: Colors.white.withOpacity(0.22),
    borderRadius: BorderRadius.circular(18),
  ),
  child: const Icon(Icons.wifi_rounded,
      color: Colors.white, size: 32),
),
        ],
      ),
    );
  }

  Widget _statGrid(List<_StatData> items) {
    return LayoutBuilder(builder: (context, c) {
      final cols = c.maxWidth > 900
? 3
: c.maxWidth > 560
    ? 2
    : 1;
      final spacing = 12.0;
      final totalSpacing = spacing * (cols - 1);
      final itemWidth = (c.maxWidth - totalSpacing) / cols;
      return Wrap(
        spacing: spacing,
        runSpacing: spacing,
        children: items.map((s) {
return SizedBox(
  width: itemWidth,
  height: 88,
  child: _statCard(s),
);
        }).toList(),
      );
    });
  }

  _StatData _stat(
      String label, String value, IconData icon, Color color) {
    return _StatData(label: label, value: value, icon: icon, color: color);
  }

  Widget _statCard(_StatData s) {
    return Container(
      padding: const EdgeInsets.symmetric(
horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AC.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AC.cardShadow,
      ),
      child: Row(
        children: [
Container(
  width: 46,
  height: 46,
  decoration: BoxDecoration(
    color: s.color.withOpacity(0.12),
    borderRadius: BorderRadius.circular(12),
  ),
  child: Icon(s.icon, color: s.color, size: 24),
),
const SizedBox(width: 14),
Expanded(
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Text(s.label,
          style: GoogleFonts.hindSiliguri(
              fontSize: 12, color: AC.grey),
          maxLines: 1,
          overflow: TextOverflow.ellipsis),
      const SizedBox(height: 2),
      Text(s.value,
          style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AC.ink)),
    ],
  ),
),
        ],
      ),
    );
  }
}

class _StatData {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _StatData({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });
}
