import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'login.dart';
import 'shell.dart';
import 'theme.dart';

const FirebaseOptions firebaseOptions = FirebaseOptions(
  apiKey: 'AIzaSyAs2g3X7hcN7x99lk1te3vBTlIGhNfryH30',
  appId: '1:862012070477:web:8cee7125b28b5853a51a04',
  messagingSenderId: '862012070477',
  projectId: 'jaj-net',
  authDomain: 'jaj-net.firebaseapp.com',
  storageBucket: 'jaj-net.firebasestorage.app',
);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: firebaseOptions);
  runApp(const AdminApp());
}

class AdminApp extends StatelessWidget {
  const AdminApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JAJ Net Admin',
      debugShowCheckedModeBanner: false,
      theme: buildAdminTheme(),
      home: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          if (snap.hasData) return const AdminShell();
          return const AdminLogin();
        },
      ),
    );
  }
}
