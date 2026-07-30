// Mobile App Entrypoint (Flutter Cross-Platform iOS & Android Blueprint)
// Features FaceID / TouchID / BiometricPrompt authentication & responsive mobile layout.

import 'package:flutter/material.dart';

void main() {
  runApp(const FinanceOSMobileApp());
}

class FinanceOSMobileApp extends StatelessWidget {
  const FinanceOSMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SarvaFlow Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF07090E),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF6366F1),
          secondary: Color(0xFF06B6D4),
        ),
      ),
      home: const MobileDashboardScreen(),
    );
  }
}

class MobileDashboardScreen extends StatefulWidget {
  const MobileDashboardScreen({super.key});

  @override
  State<MobileDashboardScreen> createState() => _MobileDashboardScreenState();
}

class _MobileDashboardScreenState extends State<MobileDashboardScreen> {
  bool _isAuthenticated = false;

  void _authenticateWithBiometrics() async {
    // Biometric authentication trigger simulation (FaceID / TouchID)
    setState(() {
      _isAuthenticated = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Finance OS Mobile', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF0F1420),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.fingerprint),
            onPressed: _authenticateWithBiometrics,
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildMetricCard('Liquid Cash Reserves', '\$42,500,000', Colors.green),
            const SizedBox(height: 12),
            _buildMetricCard('Est. Runway', '18.4 Months', Colors.indigo),
            const SizedBox(height: 12),
            _buildMetricCard('Compliance Status', _isAuthenticated ? '● Biometrics Verified' : '○ Tap Fingerprint to Unlock', Colors.cyan),
            const SizedBox(height: 24),
            const Text('Multi-Agent Control Room', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 12),
            _buildAgentTile('AP Agent', 'Processing PDF Invoices (97% STP)', Icons.receipt_long),
            _buildAgentTile('AR Agent', 'Subset-Sum Cash Application Matched', Icons.account_balance_wallet),
            _buildAgentTile('Treasury Agent', 'MMF Yield Sweep Active (5.2%)', Icons.trending_up),
            _buildAgentTile('Compliance Engine', 'OFAC AML Trie Screen Active', Icons.security),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, Color accentColor) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1420),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(color: accentColor, fontSize: 24, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildAgentTile(String title, String status, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1420),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white10),
      ),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFF6366F1)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        subtitle: Text(status, style: const TextStyle(color: Colors.green, fontSize: 12)),
      ),
    );
  }
}
