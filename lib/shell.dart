import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'pages/customer_detail.dart';
import 'pages/customers.dart';
import 'pages/dashboard.dart';
import 'pages/notices.dart';
import 'pages/payments.dart';
import 'services.dart';
import 'theme.dart';

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});
  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _page = 0;
  final _titles = ['ড্যাশবোর্ড', 'গ্রাহক', 'পেমেন্ট', 'নোটিশ'];

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final isWide = w > 820;

    final pages = [
      const DashboardPage(),
      const CustomersPage(),
      const PaymentsPage(),
      const NoticesPage(),
    ];

    if (isWide) {
      return Scaffold(
        body: Row(
          children: [
            _sidebar(context, isWide: true),
            Expanded(
              child: Column(
                children: [
                  _topBar(context, isWide: true),
                  Expanded(child: pages[_page]),
                ],
              ),
            ),
          ],
        ),
      );
    }
    return Scaffold(
      drawer: Drawer(
        backgroundColor: AC.sidebarBg,
        child: _sidebar(context, isWide: false),
      ),
      appBar: AppBar(
        backgroundColor: AC.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(_titles[_page],
            style: GoogleFonts.hindSiliguri(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AC.ink)),
        iconTheme: const IconThemeData(color: AC.ink),
      ),
      body: pages[_page],
    );
  }

  Widget _topBar(BuildContext context, {required bool isWide}) {
    return Container(
      height: 68,
      decoration: const BoxDecoration(
        color: AC.white,
        border: Border(bottom: BorderSide(color: AC.greyLight)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: [
          Text(_titles[_page],
              style: GoogleFonts.hindSiliguri(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AC.ink)),
          const Spacer(),
          StreamBuilder<QuerySnapshot>(
            stream: AdminService.pendingPayments,
            builder: (context, snap) {
              final n = snap.data?.docs.length ?? 0;
              if (n == 0) return const SizedBox.shrink();
              return Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AC.error.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.notifications_active,
                        color: AC.error, size: 16),
                    const SizedBox(width: 6),
                    Text('$n টি পেন্ডিং',
                        style: GoogleFonts.hindSiliguri(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AC.error)),
                  ],
                ),
              );
            },
          ),
          const SizedBox(width: 16),
          CircleAvatar(
            radius: 18,
            backgroundColor: AC.primary.withOpacity(0.15),
            child: Text(
              (AdminService.user?.email ?? 'A')
                  .substring(0, 1)
                  .toUpperCase(),
              style: GoogleFonts.poppins(
                color: AC.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sidebar(BuildContext context, {required bool isWide}) {
    final items = [
      (Icons.dashboard_rounded, 'ড্যাশবোর্ড'),
      (Icons.people_alt_rounded, 'গ্রাহক'),
      (Icons.payments_rounded, 'পেমেন্ট'),
      (Icons.campaign_rounded, 'নোটিশ'),
    ];
    return SizedBox(
      width: isWide ? 260 : null,
      child: Column(
        children: [
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 22),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    gradient: AC.heroGradient,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.wifi_rounded,
                      color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('JAJ Net',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        )),
                    Text('Admin Panel',
                        style: GoogleFonts.hindSiliguri(
                          fontSize: 11,
                          color: Colors.white.withOpacity(0.55),
                        )),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),
          ...List.generate(items.length, (i) {
            final active = _page == i;
            return Padding(
              padding: const EdgeInsets.symmetric(
                  horizontal: 12, vertical: 3),
              child: InkWell(
                onTap: () {
                  setState(() => _page = i);
                  if (!isWide) Navigator.pop(context);
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 14),
                  decoration: BoxDecoration(
                    color: active
                        ? AC.primary
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(items[i].$1,
                          color: active
                              ? Colors.white
                              : Colors.white.withOpacity(0.65),
                          size: 20),
                      const SizedBox(width: 14),
                      Text(items[i].$2,
                          style: GoogleFonts.hindSiliguri(
                            fontSize: 15,
                            fontWeight: active
                                ? FontWeight.w600
                                : FontWeight.w400,
                            color: active
                                ? Colors.white
                                : Colors.white.withOpacity(0.75),
                          )),
                      if (i == 2)
                        const Spacer()
                      else
                        const Spacer(),
                      if (i == 2)
                        StreamBuilder<QuerySnapshot>(
                          stream: AdminService.pendingPayments,
                          builder: (_, s) {
                            final n = s.data?.docs.length ?? 0;
                            if (n == 0)
                              return const SizedBox.shrink();
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: active
                                    ? Colors.white
                                    : AC.error,
                                borderRadius:
                                    BorderRadius.circular(20),
                              ),
                              child: Text('$n',
                                  style: GoogleFonts.poppins(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: active
                                          ? AC.primary
                                          : Colors.white)),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ),
            );
          }),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.all(12),
            child: InkWell(
              onTap: () async {
                await AdminService.signOut();
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 14),
                decoration: BoxDecoration(
                  color: AC.error.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.logout_rounded,
                        color: AC.error, size: 20),
                    const SizedBox(width: 14),
                    Text('লগআউট',
                        style: GoogleFonts.hindSiliguri(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: AC.error,
                        )),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}
