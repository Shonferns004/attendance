import 'package:flutter_test/flutter_test.dart';
import 'package:attendance_app/main.dart';

void main() {
  testWidgets('App renders', (WidgetTester tester) async {
    await tester.pumpWidget(const AttendXApp());
    expect(find.text('Scan'), findsOneWidget);
  });
}
