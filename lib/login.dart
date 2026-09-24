import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'services.dart';
import 'theme.dart';

class AdminLogin extends StatefulWidget {
  const AdminLogin({super.key});
  @override
  State<AdminLogin> createState() => _AdminLoginState();
}

class _AdminLoginState extends State<AdminLogin> {
  final _email = TextEditingController();
  final _pass = TextEditingController();
  bool _loading = false;
  bool _hide = true;

  Future<void> _login() async {
    if (_email.text.isEmpty || _pass.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      await AdminService.signIn(_email.text, _pass.text);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AC.sidebarBg,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            width: 420,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AC.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 40,
                  offset: const Offset(0, 20),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: AC.heroGradient,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: AC.primary.withOpacity(0.35),
                          blurRadius: 26,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.wifi_rounded,
                        size: 44, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 22),
                Center(
                  child: Text(
                    'JAJ Net Admin',
                    style: GoogleFonts.poppins(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: AC.ink,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Center(
                  child: Text(
                    'শুধুমাত্র অনুমোদিত ব্যবহারকারীর জন্য',
                    style: GoogleFonts.hindSiliguri(
                      fontSize: 12,
                      color: AC.grey,
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  style: GoogleFonts.hindSiliguri(
                      fontSize: 14, color: AC.ink),
                  decoration: const InputDecoration(
                    labelText: 'অ্যাডমিন ইমেইল',
                    prefixIcon: Icon(Icons.alternate_email_rounded,
                        color: AC.primary, size: 20),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _pass,
                  obscureText: _hide,
                  style: GoogleFonts.hindSiliguri(
                      fontSize: 14, color: AC.ink),
                  decoration: InputDecoration(
                    labelText: 'পাসওয়ার্ড',
                    prefixIcon: const Icon(Icons.lock_outline_rounded,
                        color: AC.primary, size: 20),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _hide
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                        color: AC.grey,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _hide = !_hide),
                    ),
                  ),
                ),
                const SizedBox(height: 26),
                SizedBox(
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _login,
                    child: _loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2.5),
                          )
                        : Text(
                            'লগইন করুন',
                            style: GoogleFonts.hindSiliguri(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
