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
            int active = 0;
            int due = 0;
            double dueAmount = 0;
            for (final d in users) {
              final m = d.data() as Map<String, dynamic>;
              final s = (m['status'] ?? '').toString();
              if (s == 'active') active++;
              if (s == 'due' || s == 'expired') due++;
              dueAmount +=
                  ((m['dueAmount'] ?? 0) as num).toDouble();
            }
            int pending = 0;
            double todayCollection = 0;
            final today = DateTime.now();
            for (final d in payments) {
              final m = d.data() as Map<String, dynamic>;
              if (m['status'] == 'pending') pending++;
              if (m['status'] == 'verified' &&
                  m['verifiedAt'] != null) {
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

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('স্বাগতম 👋',
                      style: GoogleFonts.hindSiliguri(
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: AC.ink)),
                  const SizedBox(height: 4),
                  Text('আপনার JAJ Net ব্যবসার সারসংক্ষেপ',
                      style: GoogleFonts.hindSiliguri(
                          fontSize: 14, color: AC.grey)),
                  const SizedBox(height: 24),
                  Wrap(
                    spacing: 16,
                    runSpacing: 16,
                    children: [
                      _stat('মোট গ্রাহক', '${users.length}',
                          Icons.people_alt_rounded, AC.info),
                      _stat('Active', '$active',
                          Icons.check_circle_rounded, AC.success),
                      _stat('Due/Expired', '$due',
                          Icons.warning_amber_rounded, AC.warning),
                      _stat('পেন্ডিং পেমেন্ট', '$pending',
                          Icons.pending_actions_rounded, AC.error),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Wrap(
                    spacing: 16,
                    runSpacing: 16,
                    children: [
                      _stat('আজকের আদায়',
                          '৳${todayCollection.toStringAsFixed(0)}',
                          Icons.today_rounded, AC.success),
                      _stat('মোট বকেয়া',
                          '৳${dueAmount.toStringAsFixed(0)}',
                          Icons.account_balance_wallet_rounded,
                          AC.error),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Text('সাম্প্রতিক গ্রাহক',
                      style: GoogleFonts.hindSiliguri(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AC.ink)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AC.white,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: AC.cardShadow,
                    ),
                    child: users.isEmpty
                        ? const Center(
                            child: Text('কোনো গ্রাহক নেই'))
                        : Column(
                            children: users
                                .take(5)
                                .map((d) {
                              final m = d.data()
                                  as Map<String, dynamic>;
                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: CircleAvatar(
                                  backgroundColor: AC.primary
                                      .withOpacity(0.15),
                                  child: Text(
                                    (m['name'] ?? 'U')
                                        .toString()
                                        .substring(0, 1)
                                        .toUpperCase(),
                                    style: GoogleFonts.poppins(
                                        fontWeight: FontWeight.w700,
                                        color: AC.primary),
                                  ),
                                ),
                                title: Text(m['name'] ?? '',
                                    style:
                                        GoogleFonts.hindSiliguri(
                                            fontWeight:
                                                FontWeight.w600)),
                                subtitle: Text(
                                    '${m['package'] ?? ''} • ৳${m['packagePrice'] ?? 0}',
                                    style: GoogleFonts.hindSiliguri(
                                        fontSize: 12,
                                        color: AC.grey)),
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: (m['status'] ?? '') ==
                                            'active'
                                        ? AC.success
                                            .withOpacity(0.12)
                                        : AC.warning
                                            .withOpacity(0.12),
                                    borderRadius:
                                        BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                      (m['status'] ?? '')
                                          .toString()
                                          .toUpperCase(),
                                      style: GoogleFonts.poppins(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color:
                                              (m['status'] ?? '') ==
                                                      'active'
                                                  ? AC.success
                                                  : AC.warning)),
                                ),
                              );
                            }).toList(),
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _stat(String label, String value, IconData icon, Color color) {
    return Container(
      width: 240,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AC.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: AC.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: GoogleFonts.hindSiliguri(
                        fontSize: 12, color: AC.grey)),
                const SizedBox(height: 4),
                Text(value,
                    style: GoogleFonts.poppins(
                        fontSize: 22,
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
