import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ufs_attendance/main.dart';

void main() {
  testWidgets('App renders', (WidgetTester tester) async {
    await tester.pumpWidget(AttendXApp(navigatorKey: GlobalKey<NavigatorState>()));
    expect(find.text('Scan'), findsOneWidget);
  });
}
