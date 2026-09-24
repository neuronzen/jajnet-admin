import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services.dart';
import '../theme.dart';

class PaymentsPage extends StatefulWidget {
  const PaymentsPage({super.key});
  @override
  State<PaymentsPage> createState() => _PaymentsPageState();
}

class _PaymentsPageState extends State<PaymentsPage> {
  String _tab = 'pending';

  @override
  Widget build(BuildContext context) {
    final stream = _tab == 'pending'
        ? AdminService.pendingPayments
        : AdminService.allPayments;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _tabButton('পেন্ডিং', 'pending', AC.warning),
              const SizedBox(width: 10),
              _tabButton('সব পেমেন্ট', 'all', AC.info),
            ],
          ),
          const SizedBox(height: 20),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: stream,
              builder: (context, snap) {
                if (snap.connectionState ==
                    ConnectionState.waiting) {
                  return const Center(
                      child: CircularProgressIndicator());
                }
                final docs = snap.data?.docs ?? [];
                if (docs.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long_outlined,
                            size: 64,
                            color: AC.grey.withOpacity(0.4)),
                        const SizedBox(height: 12),
                        Text(
                          _tab == 'pending'
                              ? 'কোনো পেন্ডিং পেমেন্ট নেই 🎉'
                              : 'কোনো পেমেন্ট নেই',
                          style: GoogleFonts.hindSiliguri(
                              fontSize: 15, color: AC.grey),
                        ),
                      ],
                    ),
                  );
                }
                return ListView.separated(
                  itemCount: docs.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(height: 10),
                  itemBuilder: (_, i) => _paymentCard(docs[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _tabButton(String label, String value, Color color) {
    final active = _tab == value;
    return GestureDetector(
      onTap: () => setState(() => _tab = value),
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: 18, vertical: 12),
        decoration: BoxDecoration(
          color: active ? color : AC.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: active ? null : AC.cardShadow,
        ),
        child: Text(label,
            style: GoogleFonts.hindSiliguri(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: active ? Colors.white : AC.ink)),
      ),
    );
  }

  Widget _paymentCard(DocumentSnapshot d) {
    final m = d.data() as Map<String, dynamic>;
    final status = (m['status'] ?? 'pending').toString();
    final color = status == 'verified'
        ? AC.success
        : status == 'pending'
            ? AC.warning
            : AC.error;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AC.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AC.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  status == 'verified'
                      ? Icons.check_circle_rounded
                      : status == 'pending'
                          ? Icons.pending_rounded
                          : Icons.cancel_rounded,
                  color: color,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('৳${m['amount'] ?? 0}',
                        style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AC.ink)),
                    Text(
                      'TrxID: ${m['trxId'] ?? ''}',
                      style: GoogleFonts.hindSiliguri(
                          fontSize: 13, color: AC.grey),
                    ),
                    Text(
                      'মেথড: ${m['method'] ?? 'bKash'} • ID: ${m['userId']?.toString().substring(0, 8) ?? ''}...',
                      style: GoogleFonts.hindSiliguri(
                          fontSize: 11, color: AC.grey),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(status.toUpperCase(),
                    style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: color)),
              ),
            ],
          ),
          if (status == 'pending') ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        await AdminService.rejectPayment(d.id);
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text('পেমেন্ট বাতিল করা হয়েছে'),
                              backgroundColor: AC.error),
                        );
                      },
                      icon: const Icon(Icons.close_rounded,
                          color: AC.error, size: 18),
                      label: Text('বাতিল',
                          style: GoogleFonts.hindSiliguri(
                              color: AC.error,
                              fontWeight: FontWeight.w600)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AC.error),
                        shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        await AdminService.verifyPayment(d.id);
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content:
                                  Text('পেমেন্ট Verify হয়েছে ✅'),
                              backgroundColor: AC.success),
                        );
                      },
                      icon: const Icon(Icons.check_rounded,
                          color: Colors.white, size: 18),
                      label: Text('Verify',
                          style: GoogleFonts.hindSiliguri(
                              color: Colors.white,
                              fontWeight: FontWeight.w600)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AC.success,
                        shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
