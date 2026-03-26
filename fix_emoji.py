import re

FFFD = '\uFFFD'

# ===== FIX MEDICATIONS PAGE =====
with open(r'src\app\admin\medications\page.tsx', 'r', encoding='utf-8', errors='replace') as f:
    med = f.read()

if med.startswith(FFFD):
    med = med[1:]

# Header middle dots
med = med.replace('} total \uFFFD {inStock} in stock \uFFFD {outOfStock}',
                   '} total \u00B7 {inStock} in stock \u00B7 {outOfStock}')

# Stats strip emojis
med = med.replace('className="text-2xl">\x05</span>', 'className="text-2xl">\u2705</span>')
med = med.replace('className="text-2xl">\uFFFD\x0f</span>', 'className="text-2xl">\u26A0\uFE0F</span>')
med = med.replace('className="text-2xl">=\uFFFD</span>', 'className="text-2xl">\U0001F48A</span>')

# FORM_ICONS fallback
med = med.replace("|| '=\uFFFD'\n              const ca", "|| '\U0001F48A'\n              const ca")
# CAT_ICONS fallback
med = med.replace("|| '=\uFFFD'\n              ret", "|| '\U0001F48A'\n              ret")

# Table row middle dot
med = med.replace('{med.form} \uFFFD {med.dosage}', '{med.form} \u00B7 {med.dosage}')

# Category cell control char
med = med.replace('className="text-[12px] text-gray-400">\x14</span>',
                   'className="text-[12px] text-gray-400"></span>')

# Status button emojis
med = med.replace("'\x13 In Stock'", "'\u2705 In Stock'")
med = med.replace("'\x17 Out of Stock'", "'\u26A0\uFE0F Out of Stock'")

# Empty table emoji
med = med.replace('className="text-3xl mb-2">=\uFFFD</p>',
                   'className="text-3xl mb-2">\U0001F48A</p>')

with open(r'src\app\admin\medications\page.tsx', 'w', encoding='utf-8') as f:
    f.write(med)
print('Medications: fixed')


# ===== FIX ADMIN DASHBOARD PAGE =====
with open(r'src\app\admin\dashboard\page.tsx', 'r', encoding='utf-8', errors='replace') as f:
    adm = f.read()

if adm.startswith(FFFD):
    adm = adm[1:]

# Remove control chars from JSX comments
adm = adm.replace('{/* Bed occupancy \x14 span 1 */}', '{/* Bed occupancy - span 1 */}')
adm = adm.replace('{/* Active Queue \x14 span 1 */}', '{/* Active Queue - span 1 */}')
adm = adm.replace('{/* Pending appointments \x14 span 1 */}', '{/* Pending appointments - span 1 */}')

# Department name fallback control char
adm = adm.replace("|| '\x14'", "|| ''")

# Empty pending appointments state emoji (was 📅 or 📭)
adm = adm.replace('className="text-4xl mb-2">\x05</span>',
                   'className="text-4xl mb-2">\U0001F4C5</span>')

# "Manage →" arrow
adm = adm.replace('Manage \uFFFD', 'Manage \u2192')

# Empty queue state emoji (was 🎫)
adm = adm.replace('className="text-4xl mb-2"><\uFFFD</span>',
                   'className="text-4xl mb-2">\U0001F3AB</span>')

# "View all appointments →" arrow
adm = adm.replace('View all appointments \uFFFD', 'View all appointments \u2192')

with open(r'src\app\admin\dashboard\page.tsx', 'w', encoding='utf-8') as f:
    f.write(adm)
print('Admin dashboard: fixed')


# ===== FIX DOCTOR DASHBOARD PAGE =====
with open(r'src\app\doctor\dashboard\page.tsx', 'r', encoding='utf-8', errors='replace') as f:
    doc = f.read()

if doc.startswith(FFFD):
    doc = doc[1:]

# Middle dots in specialty line
doc = doc.replace('{profile?.specialty} \uFFFD {profile?.department.name}',
                   '{profile?.specialty} \u00B7 {profile?.department.name}')
doc = doc.replace('` \uFFFD Room ${profile.room_number}`',
                   '` \u00B7 Room ${profile.room_number}`')

# Bell emoji in pending badge (=\x14 was 🔔)
doc = doc.replace('=\x14 {pending.length} new request',
                   '\U0001F514 {pending.length} new request')

# Empty appointments state emoji (=\uFFFD was 📅)
doc = doc.replace('className="text-4xl mb-2">=\uFFFD</span>\n              <p className="text-sm">No appointment',
                   'className="text-4xl mb-2">\U0001F4C5</span>\n              <p className="text-sm">No appointment')

# Phone emoji (=\uFFFD was 📞)
doc = doc.replace('>=\uFFFD {a.patient_phone}', '>\U0001F4DE {a.patient_phone}')

# Scheduled time line (=P was 📅 or similar - check context)
doc = doc.replace('                        =P {new Date(a.scheduled_at)',
                   '                        \U0001F4C5 {new Date(a.scheduled_at)')

# Empty queue state emoji (<\uFFFD was 🎫)
doc = doc.replace('className="text-4xl mb-2"><\uFFFD</span>\n              <p className="text-sm">Queue',
                   'className="text-4xl mb-2">\U0001F3AB</span>\n              <p className="text-sm">Queue')

# Accept/Decline modal title emojis
doc = doc.replace("'\x05 Accept Appointment'", "'\u2705 Accept Appointment'")
doc = doc.replace("'L Decline Appointment'", "'\u274C Decline Appointment'")

# Symptoms separator in modal
doc = doc.replace('<> \uFFFD {selectedAppt.symptoms}</>', '<> \u00B7 {selectedAppt.symptoms}</>')

# Decline custom separator
doc = doc.replace('` \x14 ${declineCustom}`', '` \u2014 ${declineCustom}`')

# Time picker button emojis (=\uFFFD Right Now / =\uFFFD Custom Time)
doc = doc.replace("'=\uFFFD Right Now'", "'\u26A1 Right Now'")
doc = doc.replace("'=\uFFFD Custom Time'", "'\U0001F4C5 Custom Time'")

with open(r'src\app\doctor\dashboard\page.tsx', 'w', encoding='utf-8') as f:
    f.write(doc)
print('Doctor dashboard: fixed')


# ===== VERIFY ALL THREE =====
for path, name in [
    (r'src\app\admin\medications\page.tsx', 'medications'),
    (r'src\app\admin\dashboard\page.tsx', 'admin-dashboard'),
    (r'src\app\doctor\dashboard\page.tsx', 'doctor-dashboard'),
]:
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    bad = [(i, repr(c)) for i, c in enumerate(content)
           if (ord(c) < 32 and c not in '\n\t\r') or ord(c) == 0xFFFD]
    if bad:
        print(f'{name} STILL HAS ISSUES: {bad[:5]}')
    else:
        print(f'{name}: CLEAN \u2705')
