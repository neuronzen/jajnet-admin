import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services.dart';
import '../theme.dart';

class NoticesPage extends StatelessWidget {
  const NoticesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: () => _showCreateDialog(context),
              icon: const Icon(Icons.add_rounded,
                  color: Colors.white),
              label: Text('নতুন নোটিশ পাঠান',
                  style: GoogleFonts.hindSiliguri(
                      fontSize: 15,
                      fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: AdminService.allNotices,
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
                        Icon(Icons.campaign_outlined,
                            size: 64,
                            color: AC.grey.withOpacity(0.4)),
                        const SizedBox(height: 12),
                        Text('এখনো কোনো নোটিশ নেই',
                            style: GoogleFonts.hindSiliguri(
                                color: AC.grey)),
                      ],
                    ),
                  );
                }
                return ListView.separated(
                  itemCount: docs.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final m = docs[i].data()
                        as Map<String, dynamic>;
                    return Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AC.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: AC.cardShadow,
                      ),
                      child: Row(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color:
                                  AC.primary.withOpacity(0.12),
                              borderRadius:
                                  BorderRadius.circular(12),
                            ),
                            child: const Icon(
                                Icons.campaign_rounded,
                                color: AC.primary),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                Text(m['title'] ?? '',
                                    style:
                                        GoogleFonts.hindSiliguri(
                                            fontSize: 15,
                                            fontWeight:
                                                FontWeight.w700,
                                            color: AC.ink)),
                                const SizedBox(height: 4),
                                Text(m['body'] ?? '',
                                    style:
                                        GoogleFonts.hindSiliguri(
                                            fontSize: 13,
                                            color: AC.grey)),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () async {
                              final ok = await showDialog<bool>(
                                context: context,
                                builder: (_) => AlertDialog(
                                  title: Text('নোটিশ মুছবেন?',
                                      style: GoogleFonts
                                          .hindSiliguri(
                                              fontWeight:
                                                  FontWeight
                                                      .w600)),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(
                                              context, false),
                                      child: const Text('না'),
                                    ),
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(
                                              context, true),
                                      child: const Text('হ্যাঁ',
                                          style: TextStyle(
                                              color: AC.error)),
                                    ),
                                  ],
                                ),
                              );
                              if (ok == true) {
                                await AdminService.deleteNotice(
                                    docs[i].id);
                              }
                            },
                            icon: const Icon(
                                Icons.delete_outline_rounded,
                                color: AC.error),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateDialog(BuildContext context) {
    final title = TextEditingController();
    final body = TextEditingController();
    bool loading = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20)),
          title: Text('নতুন নোটিশ',
              style: GoogleFonts.hindSiliguri(
                  fontWeight: FontWeight.w700)),
          content: SizedBox(
            width: 480,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: title,
                  style: GoogleFonts.hindSiliguri(
                      fontSize: 14, color: AC.ink),
                  decoration: const InputDecoration(
                    labelText: 'শিরোনাম',
                    prefixIcon: Icon(Icons.title_rounded,
                        color: AC.primary, size: 20),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: body,
                  maxLines: 5,
                  style: GoogleFonts.hindSiliguri(
                      fontSize: 14, color: AC.ink),
                  decoration: const InputDecoration(
                    labelText: 'বিস্তারিত',
                    alignLabelWithHint: true,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: loading ? null : () => Navigator.pop(ctx),
              child: Text('বাতিল',
                  style: GoogleFonts.hindSiliguri(
                      color: AC.grey)),
            ),
            ElevatedButton(
              onPressed: loading
                  ? null
                  : () async {
                      if (title.text.trim().isEmpty) return;
                      setState(() => loading = true);
                      await AdminService.addNotice(
                          title.text.trim(), body.text.trim());
                      if (!ctx.mounted) return;
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        const SnackBar(
                            content: Text(
                                'নোটিশ পাঠানো হয়েছে ✅'),
                            backgroundColor: AC.success),
                      );
                    },
              child: loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : Text('পাঠান',
                      style: GoogleFonts.hindSiliguri(
                          fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }
}
