import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AdminService {
  static final auth = FirebaseAuth.instance;
  static final db = FirebaseFirestore.instance;

  static const List<String> adminEmails = [
    'admin@jajnet.com',
    'jibonahmmedniloy@gmail.com',
  ];

  static User? get user => auth.currentUser;
  static bool get isAdmin =>
      user != null && adminEmails.contains(user!.email);

  static Future<UserCredential> signIn(
      String email, String password) async {
    final cred = await auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    if (!adminEmails.contains(cred.user!.email)) {
      await auth.signOut();
      throw 'এই অ্যাকাউন্টটি অ্যাডমিন নয়';
    }
    return cred;
  }

  static Future<void> signOut() => auth.signOut();

  static Stream<QuerySnapshot> get allUsers =>
      db.collection('users').snapshots();

  static Stream<QuerySnapshot> get allPayments => db
      .collection('payments')
      .orderBy('createdAt', descending: true)
      .snapshots();

  static Stream<QuerySnapshot> get pendingPayments => db
      .collection('payments')
      .where('status', isEqualTo: 'pending')
      .snapshots();

  static Stream<QuerySnapshot> get allNotices => db
      .collection('notices')
      .orderBy('createdAt', descending: true)
      .snapshots();

  static Future<void> verifyPayment(String id) async {
    await db.collection('payments').doc(id).update({
      'status': 'verified',
      'verifiedAt': FieldValue.serverTimestamp(),
    });
  }

  static Future<void> rejectPayment(String id) async {
    await db
        .collection('payments')
        .doc(id)
        .update({'status': 'rejected'});
  }

  static Future<void> updateUser(
      String uid, Map<String, dynamic> data) async {
    await db.collection('users').doc(uid).update(data);
  }

  static Future<void> addNotice(String title, String body) async {
    await db.collection('notices').add({
      'title': title,
      'body': body,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  static Future<void> deleteNotice(String id) async {
    await db.collection('notices').doc(id).delete();
  }
}
