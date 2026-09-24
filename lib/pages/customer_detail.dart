import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services.dart';
import '../theme.dart';

class CustomerDetailPage extends StatefulWidget {
  final String uid;
  final Map<String, dynamic> initial;
  const CustomerDetailPage({
    super.key,
    required this.uid,
    required this.initial,
  });
  @override
  State<CustomerDetailPage> createState() =>
      _CustomerDetailPageState();
}

class _CustomerDetailPageState extends State<CustomerDetailPage> {
  late TextEditingController _name;
  late TextEditingController _phone;
  late TextEditingController _address;
  late TextEditingController _package;
  late TextEditingController _price;
  late TextEditingController _dueAmount;
  String _status = 'active';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final m = widget.initial;
    _name = TextEditingController(text: m['name'] ?? '');
    _phone = TextEditingController(text: m['phone'] ?? '');
    _address = TextEditingController(text: m['address'] ?? '');
    _package = TextEditingController(text: m['package'] ?? '');
    _price =
        TextEditingController(text: (m['packagePrice'] ?? 0).toString());
    _dueAmount =
        TextEditingController(text: (m['dueAmount'] ?? 0).toString());
    _status = (m['status'] ?? 'active').toString();
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _address.dispose();
    _package.dispose();
    _price.dispose();
    _dueAmount.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await AdminService.updateUser(widget.uid, {
        'name': _name.text.trim(),
        'phone': _phone.text.trim(),
        'address': _address.text.trim(),
        'package': _package.text.trim(),
        'packagePrice': int.tryParse(_price.text) ?? 0,
        'dueAmount': int.tryParse(_dueAmount.text) ?? 0,
        'status': _status,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('গ্রাহকের তথ্য আপডেট হয়েছে ✅'),
          backgroundColor: AC.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('সমস্যা: $e')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AC.greyBg,
      appBar: AppBar(
        backgroundColor: AC.white,
        elevation: 0,
        title: Text('গ্রাহকের তথ্য',
            style: GoogleFonts.hindSiliguri(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AC.ink)),
        iconTheme: const IconThemeData(color: AC.ink),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AC.white,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: AC.cardShadow,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('তথ্য এডিট করুন',
                          style: GoogleFonts.hindSiliguri(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AC.ink)),
                      const SizedBox(height: 18),
                      _f(_name, 'নাম', Icons.person_outline_rounded),
                      const SizedBox(height: 14),
                      _f(_phone, 'ফোন', Icons.phone_outlined),
                      const SizedBox(height: 14),
                      _f(_address, 'ঠিকানা',
                          Icons.location_on_outlined),
                      const SizedBox(height: 14),
                      _f(_package, 'প্যাকেজ',
                          Icons.wifi_outlined),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: _f(_price, 'মাসিক বিল (৳)',
                                Icons.attach_money_rounded),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: _f(_dueAmount, 'বকেয়া (৳)',
                                Icons.money_off_rounded),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _status,
                        decoration: const InputDecoration(
                          labelText: 'স্ট্যাটাস',
                          prefixIcon: Icon(Icons.badge_outlined,
                              color: AC.primary, size: 20),
                        ),
                        items: const [
                          DropdownMenuItem(
                              value: 'active',
                              child: Text('Active')),
                          DropdownMenuItem(
                              value: 'due',
                              child: Text('Due')),
                          DropdownMenuItem(
                              value: 'expired',
                              child: Text('Expired')),
                        ],
                        onChanged: (v) =>
                            setState(() => _status = v ?? 'active'),
                      ),
                      const SizedBox(height: 22),
                      SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _saving ? null : _save,
                          child: _saving
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2.5))
                              : Text('সেভ করুন',
                                  style: GoogleFonts.hindSiliguri(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AC.white,
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: AC.cardShadow,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('পেমেন্ট ইতিহাস',
                          style: GoogleFonts.hindSiliguri(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AC.ink)),
                      const SizedBox(height: 14),
                      StreamBuilder<QuerySnapshot>(
                        stream: FirebaseFirestore.instance
                            .collection('payments')
                            .where('userId',
                                isEqualTo: widget.uid)
                            .snapshots(),
                        builder: (context, snap) {
                          if (!snap.hasData) {
                            return const Padding(
                              padding: EdgeInsets.all(16),
                              child: Center(
                                  child:
                                      CircularProgressIndicator()),
                            );
                          }
                          final docs = snap.data!.docs;
                          if (docs.isEmpty) {
                            return Padding(
                              padding:
                                  const EdgeInsets.all(16),
                              child: Text('কোনো পেমেন্ট নেই',
                                  style:
                                      GoogleFonts.hindSiliguri(
                                          color: AC.grey)),
                            );
                          }
                          return Column(
                            children: docs.map((d) {
                              final m = d.data()
                                  as Map<String, dynamic>;
                              final status =
                                  (m['status'] ?? 'pending')
                                      .toString();
                              final color = status == 'verified'
                                  ? AC.success
                                  : status == 'pending'
                                      ? AC.warning
                                      : AC.error;
                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color:
                                        color.withOpacity(0.12),
                                    borderRadius:
                                        BorderRadius.circular(10),
                                  ),
                                  child: Icon(Icons.receipt_long,
                                      color: color, size: 20),
                                ),
                                title: Text('৳${m['amount'] ?? 0}',
                                    style: GoogleFonts.poppins(
                                        fontWeight:
                                            FontWeight.w600)),
                                subtitle: Text(
                                    'TrxID: ${m['trxId'] ?? ''}',
                                    style: GoogleFonts
                                        .hindSiliguri(
                                            fontSize: 12,
                                            color: AC.grey)),
                                trailing: Text(
                                  status.toUpperCase(),
                                  style: GoogleFonts.poppins(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: color),
                                ),
                              );
                            }).toList(),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _f(TextEditingController c, String label, IconData icon) {
    return TextField(
      controller: c,
      style: GoogleFonts.hindSiliguri(fontSize: 14, color: AC.ink),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AC.primary, size: 20),
      ),
    );
  }
}
