import { loginStudent, registerStudent } from '../lib/server/students.js'

async function main() {
  const email = `debug-${Date.now()}@test.mn`
  const reg = await registerStudent({
    email,
    password: 'secret12',
    lastName: 'A',
    firstName: 'B',
    classGroup: '6-1',
  })
  console.log('register', reg)

  const login = await loginStudent(email, 'secret12')
  console.log('login', login)

  const bad = await loginStudent(email, 'wrong')
  console.log('bad', bad)
}

main().catch(console.error)
